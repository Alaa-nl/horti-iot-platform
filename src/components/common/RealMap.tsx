import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'greenhouse' | 'sensor' | 'irrigation' | 'alert';
  status: 'active' | 'warning' | 'critical' | 'offline';
  description?: string;
}

interface RealMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  height?: string;
}

// Custom marker icons
const createCustomIcon = (type: string, status: string) => {
  const colors = {
    active: '#10B981',
    warning: '#F59E0B',
    critical: '#EF4444',
    offline: '#6B7280'
  };

  const icons = {
    greenhouse: '🏠',
    sensor: '📡',
    irrigation: '💧',
    alert: '⚠️'
  };

  const color = colors[status as keyof typeof colors] || '#10B981';
  const emoji = icons[type as keyof typeof icons] || '📍';

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${emoji}
        ${status === 'active' ? `
          <div style="
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            background-color: ${color};
            opacity: 0.6;
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'custom-marker'
  });
};

// Component to update map view when center changes
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

const RealMap: React.FC<RealMapProps> = ({
  center,
  zoom = 15,
  markers = [],
  className = '',
  height = '400px'
}) => {
  // Default greenhouse marker at the center
  const defaultMarkers: MapMarker[] = [
    {
      id: 'main-greenhouse',
      lat: center.lat,
      lng: center.lng,
      title: 'Selected Greenhouse',
      type: 'greenhouse',
      status: 'active',
      description: 'Main greenhouse facility with automated climate control and sensor monitoring.'
    }
  ];

  const allMarkers = markers.length > 0 ? markers : defaultMarkers;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Map Header */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-center pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg pointer-events-auto">
          <h3 className="font-bold text-gray-800 text-sm">Real Map View</h3>
          <p className="text-xs text-gray-600">
            {center.lat.toFixed(4)}°N, {center.lng.toFixed(4)}°E
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg pointer-events-auto">
          <div className="flex items-center text-xs text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span>Live Map</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <ChangeView center={[center.lat, center.lng]} zoom={zoom} />

        {/* OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Markers */}
        {allMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={createCustomIcon(marker.type, marker.status)}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h4 className="font-semibold text-gray-800 mb-1">{marker.title}</h4>
                <div className="flex items-center mb-2">
                  <span className="text-xs text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded mr-2">
                    {marker.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded capitalize ${
                    marker.status === 'active' ? 'bg-green-100 text-green-800' :
                    marker.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    marker.status === 'critical' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {marker.status}
                  </span>
                </div>
                {marker.description && (
                  <p className="text-xs text-gray-600 mb-2">{marker.description}</p>
                )}
                <div className="text-xs text-gray-500 border-t pt-2">
                  📍 {marker.lat.toFixed(6)}°, {marker.lng.toFixed(6)}°
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

    </motion.div>
  );
};

export default RealMap;