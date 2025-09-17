// Greenhouse type definitions
export interface Greenhouse {
  id: string;
  name: string;
  location: {
    city: string;
    region: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
    address: string;
  };
  details: {
    landArea: number; // in m²
    type: 'glass' | 'plastic' | 'polytunnel' | 'hybrid';
    yearBuilt: number;
    lastRenovation?: number;
  };
  crops: Array<{
    name: string;
    area: number; // in m²
    plantedDate: string;
    expectedHarvest: string;
    variety?: string;
  }>;
  performance: {
    previousYield: number; // kg/m²
    currentYield?: number;
    energyUsage: number; // kWh/m²/year
    waterUsage: number; // liters/m²/year
  };
  sensors: {
    temperature: number;
    humidity: number;
    moisture: number;
    co2: number;
    light: number;
    pH: number;
  };
  contact?: {
    manager: string;
    phone: string;
    email: string;
  };
}

// Mock greenhouses data for Netherlands locations
export const GREENHOUSES: Greenhouse[] = [
  {
    id: 'WHC-GH-A1',
    name: 'World Horti Center - Block A',
    location: {
      city: 'Naaldwijk',
      region: 'Zuid-Holland',
      country: 'Netherlands',
      coordinates: {
        lat: 51.9948,
        lon: 4.2061
      },
      address: 'Violierenweg 3, 2671 MV Naaldwijk'
    },
    details: {
      landArea: 80,
      type: 'glass',
      yearBuilt: 2018,
      lastRenovation: 2022
    },
    crops: [
      {
        name: 'Tomatoes',
        area: 35,
        plantedDate: '2024-02-15',
        expectedHarvest: '2024-05-20',
        variety: 'Truss Cherry'
      },
      {
        name: 'Lettuce',
        area: 25,
        plantedDate: '2024-03-01',
        expectedHarvest: '2024-04-15',
        variety: 'Butterhead'
      },
      {
        name: 'Peppers',
        area: 20,
        plantedDate: '2024-02-20',
        expectedHarvest: '2024-06-01',
        variety: 'Bell Pepper'
      }
    ],
    performance: {
      previousYield: 85,
      currentYield: 92,
      energyUsage: 120,
      waterUsage: 2340
    },
    sensors: {
      temperature: 22,
      humidity: 65,
      moisture: 42,
      co2: 800,
      light: 45000,
      pH: 6.5
    },
    contact: {
      manager: 'Dr. Jan van der Berg',
      phone: '+31 70 123 4567',
      email: 'j.vandenberg@worldhorticenter.nl'
    }
  },
  {
    id: 'WUR-GH-01',
    name: 'Wageningen Research Greenhouse',
    location: {
      city: 'Wageningen',
      region: 'Gelderland',
      country: 'Netherlands',
      coordinates: {
        lat: 51.9851,
        lon: 5.6656
      },
      address: 'Droevendaalsesteeg 1, 6708 PB Wageningen'
    },
    details: {
      landArea: 120,
      type: 'glass',
      yearBuilt: 2015,
      lastRenovation: 2023
    },
    crops: [
      {
        name: 'Cucumbers',
        area: 60,
        plantedDate: '2024-01-20',
        expectedHarvest: '2024-04-10',
        variety: 'Long Dutch'
      },
      {
        name: 'Tomatoes',
        area: 40,
        plantedDate: '2024-02-01',
        expectedHarvest: '2024-05-15',
        variety: 'Beefsteak'
      },
      {
        name: 'Herbs',
        area: 20,
        plantedDate: '2024-03-10',
        expectedHarvest: '2024-04-20',
        variety: 'Mixed Basil'
      }
    ],
    performance: {
      previousYield: 95,
      currentYield: 98,
      energyUsage: 110,
      waterUsage: 2150
    },
    sensors: {
      temperature: 24,
      humidity: 70,
      moisture: 48,
      co2: 850,
      light: 50000,
      pH: 6.3
    },
    contact: {
      manager: 'Prof. Maria Jansen',
      phone: '+31 317 123 456',
      email: 'm.jansen@wur.nl'
    }
  },
  {
    id: 'AMS-VF-03',
    name: 'Amsterdam Vertical Farm',
    location: {
      city: 'Amsterdam',
      region: 'Noord-Holland',
      country: 'Netherlands',
      coordinates: {
        lat: 52.3676,
        lon: 4.9041
      },
      address: 'Science Park 904, 1098 XH Amsterdam'
    },
    details: {
      landArea: 50,
      type: 'hybrid',
      yearBuilt: 2021,
      lastRenovation: 2024
    },
    crops: [
      {
        name: 'Leafy Greens',
        area: 30,
        plantedDate: '2024-03-05',
        expectedHarvest: '2024-04-05',
        variety: 'Mixed Salad'
      },
      {
        name: 'Strawberries',
        area: 20,
        plantedDate: '2024-01-15',
        expectedHarvest: '2024-04-30',
        variety: 'Everbearing'
      }
    ],
    performance: {
      previousYield: 120,
      currentYield: 135,
      energyUsage: 180,
      waterUsage: 1800
    },
    sensors: {
      temperature: 21,
      humidity: 60,
      moisture: 38,
      co2: 900,
      light: 40000,
      pH: 6.8
    },
    contact: {
      manager: 'Dr. Sophie de Vries',
      phone: '+31 20 987 6543',
      email: 's.devries@verticalfarm.nl'
    }
  },
  {
    id: 'ROT-GH-B2',
    name: 'Rotterdam Port Greenhouse',
    location: {
      city: 'Rotterdam',
      region: 'Zuid-Holland',
      country: 'Netherlands',
      coordinates: {
        lat: 51.9225,
        lon: 4.4792
      },
      address: 'Maasvlakte 2, 3199 Rotterdam'
    },
    details: {
      landArea: 200,
      type: 'plastic',
      yearBuilt: 2020
    },
    crops: [
      {
        name: 'Tomatoes',
        area: 100,
        plantedDate: '2024-02-10',
        expectedHarvest: '2024-05-25',
        variety: 'Roma'
      },
      {
        name: 'Eggplant',
        area: 50,
        plantedDate: '2024-02-25',
        expectedHarvest: '2024-06-15',
        variety: 'Black Beauty'
      },
      {
        name: 'Zucchini',
        area: 50,
        plantedDate: '2024-03-01',
        expectedHarvest: '2024-05-01',
        variety: 'Green'
      }
    ],
    performance: {
      previousYield: 75,
      currentYield: 80,
      energyUsage: 95,
      waterUsage: 2500
    },
    sensors: {
      temperature: 23,
      humidity: 68,
      moisture: 45,
      co2: 750,
      light: 42000,
      pH: 6.6
    },
    contact: {
      manager: 'Ing. Peter Bakker',
      phone: '+31 10 456 7890',
      email: 'p.bakker@portgreenhouse.nl'
    }
  },
  {
    id: 'EIN-TH-05',
    name: 'Eindhoven Tech Greenhouse',
    location: {
      city: 'Eindhoven',
      region: 'Noord-Brabant',
      country: 'Netherlands',
      coordinates: {
        lat: 51.4416,
        lon: 5.4697
      },
      address: 'High Tech Campus 1, 5656 AE Eindhoven'
    },
    details: {
      landArea: 65,
      type: 'glass',
      yearBuilt: 2022
    },
    crops: [
      {
        name: 'Microgreens',
        area: 25,
        plantedDate: '2024-03-15',
        expectedHarvest: '2024-03-30',
        variety: 'Mixed'
      },
      {
        name: 'Cherry Tomatoes',
        area: 40,
        plantedDate: '2024-02-05',
        expectedHarvest: '2024-05-10',
        variety: 'Sweet 100'
      }
    ],
    performance: {
      previousYield: 110,
      currentYield: 115,
      energyUsage: 130,
      waterUsage: 1950
    },
    sensors: {
      temperature: 25,
      humidity: 62,
      moisture: 40,
      co2: 820,
      light: 48000,
      pH: 6.4
    },
    contact: {
      manager: 'Dr. Lisa Vermeer',
      phone: '+31 40 234 5678',
      email: 'l.vermeer@techgreenhouse.nl'
    }
  }
];