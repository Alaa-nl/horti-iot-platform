import { Greenhouse, GREENHOUSES } from '../types/greenhouse';

// Service to manage greenhouse data
class GreenhouseService {
  private greenhouses: Greenhouse[] = GREENHOUSES;
  private currentGreenhouse: Greenhouse | null = null;

  // Get all greenhouses
  async getAllGreenhouses(): Promise<Greenhouse[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.greenhouses;
  }

  // Get greenhouse by ID
  async getGreenhouseById(id: string): Promise<Greenhouse | null> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    const greenhouse = this.greenhouses.find(gh => gh.id === id);

    if (greenhouse) {
      // Simulate real-time sensor data updates
      return {
        ...greenhouse,
        sensors: this.generateRealtimeSensorData(greenhouse.sensors)
      };
    }

    return null;
  }

  // Get greenhouse by location
  async getGreenhouseByLocation(city: string): Promise<Greenhouse | null> {
    const greenhouse = this.greenhouses.find(
      gh => gh.location.city.toLowerCase() === city.toLowerCase()
    );
    return greenhouse || null;
  }

  // Get nearest greenhouse to coordinates
  async getNearestGreenhouse(lat: number, lon: number): Promise<Greenhouse | null> {
    if (this.greenhouses.length === 0) return null;

    let nearest = this.greenhouses[0];
    let minDistance = this.calculateDistance(
      lat, lon,
      nearest.location.coordinates.lat,
      nearest.location.coordinates.lon
    );

    for (const greenhouse of this.greenhouses) {
      const distance = this.calculateDistance(
        lat, lon,
        greenhouse.location.coordinates.lat,
        greenhouse.location.coordinates.lon
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = greenhouse;
      }
    }

    return nearest;
  }

  // Update greenhouse sensor data (simulated real-time updates)
  async updateGreenhouseSensors(id: string): Promise<Greenhouse | null> {
    const greenhouse = await this.getGreenhouseById(id);
    if (!greenhouse) return null;

    return {
      ...greenhouse,
      sensors: this.generateRealtimeSensorData(greenhouse.sensors)
    };
  }

  // Generate realistic sensor variations
  private generateRealtimeSensorData(baseSensors: Greenhouse['sensors']): Greenhouse['sensors'] {
    return {
      temperature: this.varyValue(baseSensors.temperature, 2, 18, 30),
      humidity: this.varyValue(baseSensors.humidity, 5, 40, 80),
      moisture: this.varyValue(baseSensors.moisture, 3, 20, 70),
      co2: this.varyValue(baseSensors.co2, 50, 400, 1200),
      light: this.varyValue(baseSensors.light, 5000, 0, 80000),
      pH: this.varyValue(baseSensors.pH, 0.2, 5.5, 7.5)
    };
  }

  // Helper to add realistic variation to sensor values
  private varyValue(base: number, variance: number, min: number, max: number): number {
    const change = (Math.random() - 0.5) * variance;
    const newValue = base + change;
    return Math.min(max, Math.max(min, Math.round(newValue * 10) / 10));
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Set current greenhouse
  setCurrentGreenhouse(greenhouse: Greenhouse | null): void {
    this.currentGreenhouse = greenhouse;
  }

  // Get current greenhouse
  getCurrentGreenhouse(): Greenhouse | null {
    return this.currentGreenhouse;
  }

  // Save greenhouse selection to localStorage
  saveGreenhouseSelection(id: string): void {
    localStorage.setItem('selectedGreenhouseId', id);
  }

  // Load saved greenhouse selection
  async loadSavedGreenhouse(): Promise<Greenhouse | null> {
    const savedId = localStorage.getItem('selectedGreenhouseId');
    if (savedId) {
      return await this.getGreenhouseById(savedId);
    }
    // Default to first greenhouse
    return this.greenhouses[0] || null;
  }

  // Calculate greenhouse statistics
  calculateGreenhouseStats(greenhouse: Greenhouse): {
    totalCropArea: number;
    cropUtilization: number;
    averageSensorStatus: string;
    yieldImprovement: number;
  } {
    const totalCropArea = greenhouse.crops.reduce((sum, crop) => sum + crop.area, 0);
    const cropUtilization = (totalCropArea / greenhouse.details.landArea) * 100;

    // Determine sensor status based on values
    const sensorStatus = this.determineSensorStatus(greenhouse.sensors);

    const yieldImprovement = greenhouse.performance.currentYield
      ? ((greenhouse.performance.currentYield - greenhouse.performance.previousYield) /
         greenhouse.performance.previousYield) * 100
      : 0;

    return {
      totalCropArea,
      cropUtilization: Math.round(cropUtilization),
      averageSensorStatus: sensorStatus,
      yieldImprovement: Math.round(yieldImprovement * 10) / 10
    };
  }

  private determineSensorStatus(sensors: Greenhouse['sensors']): string {
    const optimalRanges = {
      temperature: { min: 20, max: 26 },
      humidity: { min: 50, max: 70 },
      moisture: { min: 35, max: 55 },
      co2: { min: 600, max: 1000 },
      pH: { min: 6.0, max: 7.0 }
    };

    let inRange = 0;
    let total = 0;

    Object.entries(optimalRanges).forEach(([key, range]) => {
      const value = sensors[key as keyof typeof sensors];
      if (typeof value === 'number') {
        total++;
        if (value >= range.min && value <= range.max) {
          inRange++;
        }
      }
    });

    const percentage = (inRange / total) * 100;
    if (percentage >= 80) return 'Optimal';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Warning';
    return 'Critical';
  }
}

// Export singleton instance
export const greenhouseService = new GreenhouseService();