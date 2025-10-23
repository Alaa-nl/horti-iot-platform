import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion } from 'framer-motion';

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

// Map style - Street Map only
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const RealMap: React.FC<RealMapProps> = ({
  center,
  zoom = 15,
  markers = [],
  className = '',
  height = '400px'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: zoom,
    pitch: 0,
    bearing: 0
  });

  const mapRef = useRef<any>(null);

  // Update view when center prop changes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: center.lng,
      latitude: center.lat
    }));
  }, [center.lng, center.lat]);

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

  // Marker colors based on status
  const getMarkerColor = (status: string) => {
    const colors = {
      active: '#10B981',
      warning: '#F59E0B',
      critical: '#EF4444',
      offline: '#6B7280'
    };
    return colors[status as keyof typeof colors] || '#10B981';
  };

  // Marker emoji based on type
  const getMarkerEmoji = (type: string) => {
    const emojis = {
      greenhouse: '🏠',
      sensor: '📡',
      irrigation: '💧',
      alert: '⚠️'
    };
    return emojis[type as keyof typeof emojis] || '📍';
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Fly to greenhouse location
  const flyToGreenhouse = () => {
    setViewState(prev => ({
      ...prev,
      longitude: center.lng,
      latitude: center.lat,
      zoom: 17,
      pitch: 0,
      bearing: 0
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden ${className} ${
        isExpanded ? 'fixed inset-4 z-[9999]' : ''
      }`}
      style={isExpanded ? { height: 'calc(100vh - 2rem)' } : { height }}
    >
      {/* Greenhouse Location Button - Top Left Below Controls */}
      <div className="absolute top-[140px] left-[10px] z-[1000] pointer-events-auto">
        <button
          onClick={flyToGreenhouse}
          className="bg-white rounded shadow-md hover:bg-gray-50 transition-colors w-[29px] h-[29px] flex items-center justify-center"
          title="Go to Greenhouse Location"
          style={{ border: 'none' }}
        >
          <span className="text-lg">🏠</span>
        </button>
      </div>

      {/* Map Controls - Top Right */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Expand/Collapse Button */}
          <button
            onClick={toggleExpanded}
            className="bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            title={isExpanded ? 'Exit Fullscreen' : 'Expand Map'}
          >
            {isExpanded ? '⬇️ Minimize' : '⬆️ Expand'}
          </button>

          {/* Live Status */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg">
            <div className="flex items-center text-xs text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Navigation Controls (Zoom, Compass) */}
        <NavigationControl position="top-left" showCompass={true} />

        {/* Fullscreen Control */}
        <FullscreenControl position="top-left" />

        {/* Scale Control */}
        <ScaleControl position="bottom-left" />

        {/* Markers */}
        {allMarkers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedMarker(marker);
            }}
          >
            <div
              style={{
                backgroundColor: getMarkerColor(marker.status),
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {getMarkerEmoji(marker.type)}
              {marker.status === 'active' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    right: '-3px',
                    bottom: '-3px',
                    borderRadius: '50%',
                    backgroundColor: getMarkerColor(marker.status),
                    opacity: 0.6,
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
              )}
            </div>
          </Marker>
        ))}

        {/* Popup for selected marker */}
        {selectedMarker && (
          <Popup
            longitude={selectedMarker.lng}
            latitude={selectedMarker.lat}
            anchor="top"
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
            className="custom-popup"
          >
            <div className="p-3 min-w-[200px]">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">{selectedMarker.title}</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded">
                  {selectedMarker.type}
                </span>
                <span className={`text-xs px-2 py-1 rounded capitalize ${
                  selectedMarker.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedMarker.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  selectedMarker.status === 'critical' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedMarker.status}
                </span>
              </div>
              {selectedMarker.description && (
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">{selectedMarker.description}</p>
              )}
              <div className="text-xs text-gray-500 border-t pt-2 mt-2">
                📍 {selectedMarker.lat.toFixed(6)}°, {selectedMarker.lng.toFixed(6)}°
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Ping animation styles */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }

        .maplibregl-popup-content {
          padding: 0 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          border-radius: 12px !important;
        }

        .maplibregl-popup-tip {
          border-top-color: white !important;
        }

        .maplibregl-ctrl-group button {
          width: 32px !important;
          height: 32px !important;
        }
      `}</style>
    </motion.div>
  );
};

export default RealMap;
