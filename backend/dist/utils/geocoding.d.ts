interface GeocodingResult {
    lat: number;
    lon: number;
    display_name: string;
    city?: string;
    region?: string;
    country?: string;
}
export declare function geocodeLocation(location: string): Promise<GeocodingResult | null>;
export declare function parseLocationString(location: string): {
    city: string;
    region: string;
};
export {};
//# sourceMappingURL=geocoding.d.ts.map