export type AggregationMode = 'raw' | 'hourly' | '6hour' | 'daily' | 'weekly';
export interface PhytoSenseDataPoint {
    dateTime: Date;
    value: number;
}
export interface PhytoSenseResponse {
    success: boolean;
    aggregation: AggregationMode;
    dataPoints: number;
    data: PhytoSenseDataPoint[];
    metadata?: {
        setupId: number;
        tdid: number;
        channel: number;
        dateRange: {
            from: string;
            till: string;
        };
    };
}
export interface PhytoSenseDevice {
    setupId: number;
    name: string;
    fromDate: string;
    toDate: string;
    diameterTDID: number;
    diameterChannelId: number;
    sapFlowTDID: number;
    sapFlowChannelId: number;
    cropType: string;
}
declare class PhytoSenseService {
    private config;
    private axiosInstance;
    private devices;
    constructor();
    getDevices(): PhytoSenseDevice[];
    fetchData(tdid: number, params: {
        setup_id: number;
        channel: number;
        after?: string;
        before?: string;
        from?: string;
        till?: string;
    }, aggregation?: AggregationMode, retryCount?: number): Promise<PhytoSenseResponse>;
    private calculateDateRange;
    private fetchDataInChunks;
    private parseAndAggregateXML;
    private aggregateData;
    calculateOptimalAggregation(startDate: Date, endDate: Date): AggregationMode;
    healthCheck(): Promise<{
        status: string;
        message: string;
    }>;
}
export declare const phytoSenseService: PhytoSenseService;
export {};
//# sourceMappingURL=phytosense.service.d.ts.map