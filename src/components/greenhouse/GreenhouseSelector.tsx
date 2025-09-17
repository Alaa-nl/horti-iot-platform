import React from 'react';
import { motion } from 'framer-motion';
import { Greenhouse } from '../../types/greenhouse';

interface GreenhouseSelectorProps {
  greenhouses: Greenhouse[];
  selectedGreenhouse: Greenhouse | null;
  onSelect: (greenhouse: Greenhouse) => void;
  loading?: boolean;
}

const GreenhouseSelector: React.FC<GreenhouseSelectorProps> = ({
  greenhouses,
  selectedGreenhouse,
  onSelect,
  loading = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Select Greenhouse</h3>
          {loading && (
            <div className="flex items-center text-xs text-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
              Loading data...
            </div>
          )}
        </div>

        <div className="relative">
          <select
            value={selectedGreenhouse?.id || ''}
            onChange={(e) => {
              const greenhouse = greenhouses.find(gh => gh.id === e.target.value);
              if (greenhouse) onSelect(greenhouse);
            }}
            disabled={loading}
            className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl appearance-none cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>Choose a greenhouse...</option>
            {greenhouses.map(greenhouse => (
              <option key={greenhouse.id} value={greenhouse.id}>
                {greenhouse.name} - {greenhouse.location.city}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {selectedGreenhouse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-semibold text-gray-700">{selectedGreenhouse.location.city}, {selectedGreenhouse.location.region}</p>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <p className="font-semibold text-gray-700">{selectedGreenhouse.details.landArea} m²</p>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-semibold text-gray-700 capitalize">{selectedGreenhouse.details.type}</p>
              </div>
              <div>
                <span className="text-gray-500">Manager:</span>
                <p className="font-semibold text-gray-700">{selectedGreenhouse.contact?.manager || 'N/A'}</p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-gray-600">Connected</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedGreenhouse.location.coordinates.lat.toFixed(2)}°, {selectedGreenhouse.location.coordinates.lon.toFixed(2)}°
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default GreenhouseSelector;