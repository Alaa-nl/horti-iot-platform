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
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative"
    >
      <div className="bg-card rounded-2xl shadow-soft border p-5 hover:shadow-medium transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Select Greenhouse</h3>
          {loading && (
            <div className="flex items-center text-xs text-primary font-medium">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
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
            className="w-full px-4 py-3 pr-10 text-sm font-semibold text-foreground bg-background border-2 border-primary rounded-xl appearance-none cursor-pointer hover:border-primary hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {selectedGreenhouse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 pt-4 border-t"
          >
            {/* Status indicator only */}
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-primary/10 px-4 py-2 rounded-full border border-primary/30">
                <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse-soft shadow-glow-green"></div>
                <span className="text-xs text-muted-foreground font-semibold">Connected & Active</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default GreenhouseSelector;