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
      className="relative z-10"
    >
      <div className="bg-card rounded-2xl shadow-soft border p-5 hover:shadow-medium transition-all duration-300 relative">
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
            className="select-elevated relative z-20"
          >
            <option value="" disabled>Choose a greenhouse...</option>
            {greenhouses.map(greenhouse => (
              <option key={greenhouse.id} value={greenhouse.id}>
                {greenhouse.name} - {greenhouse.location.city}
              </option>
            ))}
          </select>
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