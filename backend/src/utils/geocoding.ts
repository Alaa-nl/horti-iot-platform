import axios from 'axios';

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  city?: string;
  region?: string;
  country?: string;
}

/**
 * Geocodes a location string using OpenStreetMap's Nominatim API
 * @param location - The location string to geocode (e.g., "Amsterdam, Netherlands")
 * @returns Coordinates and parsed location details
 */
export async function geocodeLocation(location: string): Promise<GeocodingResult | null> {
  try {
    // Use Nominatim API (OpenStreetMap's geocoding service)
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: location,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'HortiIoTPlatform/1.0' // Required by Nominatim
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

    // If no results from Nominatim, return default Netherlands greenhouse region coordinates
    console.warn(`No geocoding results for location: ${location}, using defaults`);
    return {
      lat: 52.0607,
      lon: 4.3517,
      display_name: location,
      city: 'Unknown',
      region: 'Netherlands'
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    // Return default coordinates as fallback
    return {
      lat: 52.0607,
      lon: 4.3517,
      display_name: location,
      city: 'Unknown',
      region: 'Netherlands'
    };
  }
}

/**
 * Extracts city and region from a location string as a fallback
 * @param location - The location string to parse
 * @returns Parsed city and region
 */
export function parseLocationString(location: string): { city: string; region: string } {
  const parts = location.split(',').map(part => part.trim());

  if (parts.length >= 2) {
    return {
      city: parts[parts.length - 2],
      region: parts[parts.length - 1]
    };
  } else if (parts.length === 1) {
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