import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'greenhouse' | 'sensor' | 'irrigation' | 'alert';
  status: 'active' | 'warning' | 'critical' | 'offline';
}

interface FarmMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
}

const FarmMap: React.FC<FarmMapProps> = ({
  center = { lat: 52.0565, lng: 4.2815 }, // Naaldwijk, Netherlands
  zoom = 15,
  markers = [],
  className = ''
}) => {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapView, setMapView] = useState<'map' | 'satellite'>('satellite');

  // Default markers for the World Horti Center
  const defaultMarkers: MapMarker[] = [
    { id: '1', lat: 52.0565, lng: 4.2815, title: 'Greenhouse A1', type: 'greenhouse', status: 'active' },
    { id: '2', lat: 52.0567, lng: 4.2817, title: 'Climate Sensor Zone A', type: 'sensor', status: 'active' },
    { id: '3', lat: 52.0563, lng: 4.2813, title: 'Irrigation System', type: 'irrigation', status: 'active' },
    { id: '4', lat: 52.0569, lng: 4.2819, title: 'Moisture Alert', type: 'alert', status: 'warning' },
    { id: '5', lat: 52.0561, lng: 4.2811, title: 'Greenhouse B2', type: 'greenhouse', status: 'active' }
  ];

  const allMarkers = [...defaultMarkers, ...markers];

  const getMarkerColor = (type: string, status: string) => {
    switch (status) {
      case 'active':
        return type === 'greenhouse' ? '#10B981' : '#3B82F6';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      case 'offline':
        return '#6B7280';
      default:
        return '#10B981';
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'greenhouse':
        return '🏠';
      case 'sensor':
        return '📡';
      case 'irrigation':
        return '💧';
      case 'alert':
        return '⚠️';
      default:
        return '📍';
    }
  };

  return (
    <div className={`relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      {/* Map Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
          <h3 className="font-bold text-gray-800 text-sm">Farm View</h3>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setMapView('map')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mapView === 'map'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setMapView('satellite')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              mapView === 'satellite'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/90 text-gray-600 hover:bg-white'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-20 right-4 z-10 flex flex-col space-y-1">
        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center text-gray-600 hover:bg-white transition-all">
          <span className="text-lg font-bold">+</span>
        </button>
        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center text-gray-600 hover:bg-white transition-all">
          <span className="text-lg font-bold">−</span>
        </button>
      </div>

      {/* Map Area */}
      <div
        className={`w-full h-full min-h-[400px] relative ${
          mapView === 'satellite'
            ? 'bg-gradient-to-br from-green-200 via-green-300 to-green-400'
            : 'bg-gray-100'
        }`}
        style={{
          backgroundImage: mapView === 'satellite'
            ? `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            : undefined
        }}
      >
        {/* Satellite View Pattern */}
        {mapView === 'satellite' && (
          <div className="absolute inset-0">
            {/* Field patterns */}
            <div className="absolute top-1/4 left-1/4 w-32 h-24 bg-green-400/30 rounded-lg transform rotate-12"></div>
            <div className="absolute top-1/3 right-1/4 w-28 h-20 bg-green-500/40 rounded-lg transform -rotate-6"></div>
            <div className="absolute bottom-1/3 left-1/3 w-36 h-28 bg-green-600/20 rounded-lg transform rotate-3"></div>

            {/* Roads */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-400/60 transform -rotate-2"></div>
            <div className="absolute top-0 bottom-0 left-2/3 w-1 bg-gray-400/60"></div>
          </div>
        )}

        {/* Map Grid Lines for Map View */}
        {mapView === 'map' && (
          <div className="absolute inset-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full h-px bg-gray-300/50" style={{ top: `${i * 10}%` }} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full w-px bg-gray-300/50" style={{ left: `${i * 10}%` }} />
            ))}
          </div>
        )}

        {/* Markers */}
        {allMarkers.map((marker, index) => (
          <motion.div
            key={marker.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer"
            style={{
              left: `${20 + (marker.lng - center.lng) * 8000 + Math.random() * 40}%`,
              top: `${50 + (center.lat - marker.lat) * 8000 + Math.random() * 30}%`,
            }}
            onClick={() => setSelectedMarker(marker)}
          >
            {/* Marker Pin */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-xs transform hover:scale-110 transition-all duration-200"
                style={{ backgroundColor: getMarkerColor(marker.type, marker.status) }}
              >
                <span className="text-white filter drop-shadow-sm">
                  {getMarkerIcon(marker.type)}
                </span>
              </div>

              {/* Pulse Animation for Active Markers */}
              {marker.status === 'active' && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: getMarkerColor(marker.type, marker.status) }}
                />
              )}
            </div>

            {/* Marker Tooltip */}
            {selectedMarker?.id === marker.id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-2 min-w-max z-10"
              >
                <div className="text-xs">
                  <p className="font-semibold text-gray-800">{marker.title}</p>
                  <p className="text-gray-600 capitalize">{marker.type}</p>
                  <div className="flex items-center mt-1">
                    <div
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: getMarkerColor(marker.type, marker.status) }}
                    />
                    <span className="text-gray-500 capitalize">{marker.status}</span>
                  </div>
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              </motion.div>
            )}
          </motion.div>
        ))}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-800 mb-2">Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-600">Greenhouse</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-600">Sensors</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-gray-600">Alerts</span>
            </div>
          </div>
        </div>

        {/* Scale */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-8 h-px bg-gray-600 mr-2"></div>
            <span>50m</span>
          </div>
        </div>
      </div>

      {/* Close tooltip when clicking outside */}
      {selectedMarker && (
        <div
          className="absolute inset-0 z-0"
          onClick={() => setSelectedMarker(null)}
        />
      )}
    </div>
  );
};

export default FarmMap;