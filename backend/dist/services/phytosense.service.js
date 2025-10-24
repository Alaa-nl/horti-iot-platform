"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.phytoSenseService = void 0;
const axios_1 = __importDefault(require("axios"));
const xmldom_1 = require("xmldom");
const logger_1 = require("../utils/logger");
const phytosense_config_1 = require("../config/phytosense.config");
const cache_service_1 = require("./cache.service");
class PhytoSenseService {
    constructor() {
        this.config = phytosense_config_1.phytoSenseConfig;
        this.axiosInstance = axios_1.default.create({
            baseURL: this.config.baseUrl,
            auth: {
                username: this.config.auth.username,
                password: this.config.auth.password
            },
            headers: {
                'Accept': 'application/xml, text/xml',
                'User-Agent': 'HORTI-IOT-Platform/1.0'
            },
            timeout: this.config.timeout,
            maxContentLength: this.config.maxContentLength,
            maxBodyLength: this.config.maxContentLength
        });
        this.devices = [
            {
                setupId: 1324,
                name: 'Stem051 - NL 2022 MKB Raak',
                fromDate: '2022-10-19T00:00:00',
                toDate: '2023-06-01T09:42:23',
                diameterTDID: 33385,
                diameterChannelId: 0,
                sapFlowTDID: 33387,
                sapFlowChannelId: 0,
                cropType: 'General'
            },
            {
                setupId: 1324,
                name: 'Stem127 - NL 2022 MKB Raak',
                fromDate: '2022-10-19T00:00:00',
                toDate: '2023-06-01T09:42:23',
                diameterTDID: 33386,
                diameterChannelId: 0,
                sapFlowTDID: 33388,
                sapFlowChannelId: 0,
                cropType: 'General'
            },
            {
                setupId: 1445,
                name: 'Stem051 - NL 2023 Tomato',
                fromDate: '2023-06-23T00:00:00',
                toDate: '2023-08-25T13:30:00',
                diameterTDID: 38210,
                diameterChannelId: 0,
                sapFlowTDID: 39916,
                sapFlowChannelId: 0,
                cropType: 'Tomato'
            },
            {
                setupId: 1445,
                name: 'Stem136 - NL 2023 Tomato',
                fromDate: '2023-06-23T00:00:00',
                toDate: '2023-08-25T13:30:00',
                diameterTDID: 38211,
                diameterChannelId: 0,
                sapFlowTDID: 39915,
                sapFlowChannelId: 0,
                cropType: 'Tomato'
            },
            {
                setupId: 1445,
                name: 'Stem051 - NL 2023 Cucumber',
                fromDate: '2023-08-25T13:30:00',
                toDate: '2023-10-20T00:00:00',
                diameterTDID: 38210,
                diameterChannelId: 0,
                sapFlowTDID: 39916,
                sapFlowChannelId: 0,
                cropType: 'Cucumber'
            },
            {
                setupId: 1445,
                name: 'Stem136 - NL 2023 Cucumber',
                fromDate: '2023-08-25T13:30:00',
                toDate: '2023-10-20T00:00:00',
                diameterTDID: 38211,
                diameterChannelId: 0,
                sapFlowTDID: 39915,
                sapFlowChannelId: 0,
                cropType: 'Cucumber'
            },
            {
                setupId: 1508,
                name: 'Stem051 - NL 2023-2024 MKB Raak',
                fromDate: '2023-11-01T00:00:00',
                toDate: '2024-10-15T12:00:00',
                diameterTDID: 39999,
                diameterChannelId: 0,
                sapFlowTDID: 39987,
                sapFlowChannelId: 0,
                cropType: 'General'
            },
            {
                setupId: 1508,
                name: 'Stem136 - NL 2023-2024 MKB Raak',
                fromDate: '2023-11-01T00:00:00',
                toDate: '2024-10-15T12:00:00',
                diameterTDID: 40007,
                diameterChannelId: 0,
                sapFlowTDID: 39981,
                sapFlowChannelId: 0,
                cropType: 'General'
            }
        ];
    }
    getDevices() {
        return this.devices;
    }
    async fetchData(tdid, params, aggregation = 'raw', retryCount = 0) {
        const maxRetries = 2;
        const cacheKey = cache_service_1.cacheService.generatePhytoSenseKey(tdid, params, aggregation);
        const cachedData = cache_service_1.cacheService.get(cacheKey);
        if (cachedData) {
            logger_1.logger.info('Returning cached PhytoSense data', {
                tdid,
                aggregation,
                dataPoints: cachedData.dataPoints
            });
            return cachedData;
        }
        try {
            const url = `/${this.config.account}/DeviceTransformation/${tdid}`;
            const requestParams = {
                app_key: this.config.appKey,
                ...params
            };
            logger_1.logger.info('Fetching PhytoSense data from API', {
                tdid,
                params: requestParams,
                aggregation,
                attempt: retryCount + 1
            });
            const dateRange = this.calculateDateRange(params);
            const timeout = dateRange > 180 ? 120000 : 60000;
            const response = await this.axiosInstance.get(url, {
                params: requestParams,
                timeout
            });
            const xmlData = response.data;
            if (typeof xmlData === 'string' && !xmlData.includes('</PhytoSenseReply>')) {
                throw new Error('Incomplete XML response received');
            }
            const parsedData = this.parseAndAggregateXML(xmlData, aggregation);
            const result = {
                success: true,
                aggregation,
                dataPoints: parsedData.length,
                data: parsedData,
                metadata: {
                    setupId: params.setup_id,
                    tdid,
                    channel: params.channel,
                    dateRange: {
                        from: params.after || params.from || '',
                        till: params.before || params.till || ''
                    }
                }
            };
            logger_1.logger.info('PhytoSense data fetched successfully', {
                tdid,
                dataPoints: result.dataPoints,
                aggregation
            });
            const startDate = new Date(params.after || params.from || new Date());
            const endDate = new Date(params.before || params.till || new Date());
            const ttl = cache_service_1.cacheService.calculateTTL(startDate, endDate);
            cache_service_1.cacheService.set(cacheKey, result, ttl);
            logger_1.logger.debug('Cached PhytoSense data', {
                tdid,
                aggregation,
                ttl
            });
            return result;
        }
        catch (error) {
            const isIncompleteXML = error.message === 'Incomplete XML response received' ||
                (error.response?.data && typeof error.response.data === 'string' &&
                    !error.response.data.includes('</PhytoSenseReply>'));
            if (retryCount < maxRetries && (isIncompleteXML || error.code === 'ECONNABORTED')) {
                logger_1.logger.warn('Retrying PhytoSense request due to incomplete response', {
                    tdid,
                    attempt: retryCount + 1,
                    error: error.message
                });
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
                if (retryCount === 1 && this.calculateDateRange(params) > 365) {
                    return await this.fetchDataInChunks(tdid, params, aggregation);
                }
                return await this.fetchData(tdid, params, aggregation, retryCount + 1);
            }
            logger_1.logger.error('PhytoSense API error', {
                tdid,
                error: error.message,
                response: error.response?.data?.substring?.(0, 500)
            });
            throw {
                success: false,
                message: error.response?.statusText || error.message || 'Failed to fetch PhytoSense data',
                status: error.response?.status || 500,
                error: error.response?.data || error.message
            };
        }
    }
    calculateDateRange(params) {
        const startStr = params.after || params.from;
        const endStr = params.before || params.till;
        if (!startStr || !endStr)
            return 0;
        const start = new Date(startStr);
        const end = new Date(endStr);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    async fetchDataInChunks(tdid, params, aggregation) {
        const startStr = params.after || params.from;
        const endStr = params.before || params.till;
        if (!startStr || !endStr) {
            return await this.fetchData(tdid, params, aggregation);
        }
        const start = new Date(startStr);
        const end = new Date(endStr);
        const chunkSizeDays = 180;
        logger_1.logger.info('Fetching data in chunks due to large date range', {
            tdid,
            dateRange: this.calculateDateRange(params),
            chunkSize: chunkSizeDays
        });
        const allData = [];
        let currentStart = new Date(start);
        while (currentStart < end) {
            const currentEnd = new Date(Math.min(currentStart.getTime() + (chunkSizeDays * 24 * 60 * 60 * 1000), end.getTime()));
            const chunkParams = {
                ...params,
                after: currentStart.toISOString(),
                before: currentEnd.toISOString()
            };
            try {
                const chunkResult = await this.fetchData(tdid, chunkParams, 'raw', 0);
                allData.push(...chunkResult.data);
            }
            catch (error) {
                logger_1.logger.warn('Failed to fetch chunk, continuing with partial data', {
                    tdid,
                    chunkStart: currentStart.toISOString(),
                    chunkEnd: currentEnd.toISOString(),
                    error: error.message
                });
            }
            currentStart = new Date(currentEnd.getTime() + 1);
        }
        const aggregatedData = aggregation === 'raw'
            ? allData
            : this.aggregateData(allData, aggregation);
        return {
            success: true,
            aggregation,
            dataPoints: aggregatedData.length,
            data: aggregatedData,
            metadata: {
                setupId: params.setup_id,
                tdid,
                channel: params.channel,
                dateRange: {
                    from: startStr,
                    till: endStr
                }
            }
        };
    }
    parseAndAggregateXML(xmlData, aggregationMode) {
        const parser = new xmldom_1.DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
        const valueElements = xmlDoc.getElementsByTagName('DeviceTransformationChannelValue');
        const rawData = [];
        for (let i = 0; i < valueElements.length; i++) {
            const element = valueElements[i];
            const dateTime = element.getAttribute('DateTime');
            const value = element.getAttribute('Value');
            if (dateTime && value) {
                rawData.push({
                    dateTime: new Date(dateTime),
                    value: parseFloat(value)
                });
            }
        }
        rawData.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
        logger_1.logger.debug(`Parsed ${rawData.length} raw data points`);
        if (aggregationMode === 'raw' || !aggregationMode) {
            return rawData;
        }
        return this.aggregateData(rawData, aggregationMode);
    }
    aggregateData(rawData, aggregationMode) {
        if (rawData.length === 0)
            return [];
        const aggregated = [];
        let intervalMs;
        switch (aggregationMode) {
            case 'hourly':
                intervalMs = 60 * 60 * 1000;
                break;
            case '6hour':
                intervalMs = 6 * 60 * 60 * 1000;
                break;
            case 'daily':
                intervalMs = 24 * 60 * 60 * 1000;
                break;
            case 'weekly':
                intervalMs = 7 * 24 * 60 * 60 * 1000;
                break;
            default:
                return rawData;
        }
        let currentBucket = [];
        let bucketStart = rawData[0].dateTime.getTime();
        rawData.forEach(point => {
            const pointTime = point.dateTime.getTime();
            if (pointTime - bucketStart < intervalMs) {
                currentBucket.push(point);
            }
            else {
                if (currentBucket.length > 0) {
                    const avgValue = currentBucket.reduce((sum, p) => sum + p.value, 0) / currentBucket.length;
                    const bucketMidpoint = new Date(bucketStart + intervalMs / 2);
                    aggregated.push({
                        dateTime: bucketMidpoint,
                        value: parseFloat(avgValue.toFixed(3))
                    });
                }
                bucketStart = Math.floor(pointTime / intervalMs) * intervalMs;
                currentBucket = [point];
            }
        });
        if (currentBucket.length > 0) {
            const avgValue = currentBucket.reduce((sum, p) => sum + p.value, 0) / currentBucket.length;
            const bucketMidpoint = new Date(bucketStart + intervalMs / 2);
            aggregated.push({
                dateTime: bucketMidpoint,
                value: parseFloat(avgValue.toFixed(3))
            });
        }
        logger_1.logger.debug(`Aggregated ${rawData.length} points to ${aggregated.length} points (${aggregationMode})`);
        return aggregated;
    }
    calculateOptimalAggregation(startDate, endDate) {
        const diffMs = endDate.getTime() - startDate.getTime();
        const days = diffMs / (1000 * 60 * 60 * 24);
        if (days <= 7)
            return 'raw';
        if (days <= 30)
            return 'hourly';
        if (days <= 90)
            return '6hour';
        if (days <= 365)
            return 'daily';
        return 'weekly';
    }
    async healthCheck() {
        try {
            const testDevice = this.devices[0];
            const testDate = new Date();
            const testParams = {
                setup_id: testDevice.setupId,
                channel: 0,
                after: new Date(testDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                before: testDate.toISOString()
            };
            await this.fetchData(testDevice.diameterTDID, testParams, 'raw');
            return {
                status: 'healthy',
                message: 'PhytoSense API is accessible'
            };
        }
        catch (error) {
            logger_1.logger.error('PhytoSense health check failed', { error: error.message });
            return {
                status: 'unhealthy',
                message: error.message || 'PhytoSense API is not accessible'
            };
        }
    }
}
exports.phytoSenseService = new PhytoSenseService();
//# sourceMappingURL=phytosense.service.js.map