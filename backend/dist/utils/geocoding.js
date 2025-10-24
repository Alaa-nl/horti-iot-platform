"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.geocodeLocation = geocodeLocation;
exports.parseLocationString = parseLocationString;
const axios_1 = __importDefault(require("axios"));
async function geocodeLocation(location) {
    try {
        const response = await axios_1.default.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: location,
                format: 'json',
                limit: 1,
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'HortiIoTPlatform/1.0'
            }
        });
        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            const address = result.address || {};
            return {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
                display_name: result.display_name,
                city: address.city || address.town || address.village || address.municipality,
                region: address.state || address.province || address.region,
                country: address.country
            };
        }
        console.warn(`No geocoding results for location: ${location}, using defaults`);
        return {
            lat: 52.0607,
            lon: 4.3517,
            display_name: location,
            city: 'Unknown',
            region: 'Netherlands'
        };
    }
    catch (error) {
        console.error('Geocoding error:', error);
        return {
            lat: 52.0607,
            lon: 4.3517,
            display_name: location,
            city: 'Unknown',
            region: 'Netherlands'
        };
    }
}
function parseLocationString(location) {
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
        return {
            city: parts[parts.length - 2],
            region: parts[parts.length - 1]
        };
    }
    else if (parts.length === 1) {
        return {
            city: parts[0],
            region: 'Unknown'
        };
    }
    return {
        city: 'Unknown',
        region: 'Unknown'
    };
}
//# sourceMappingURL=geocoding.js.map