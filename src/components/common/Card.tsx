import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={`bg-white rounded-2xl shadow-soft border border-gray-100 p-6 transition-all duration-300 ${
        hover ? 'hover:shadow-medium hover:border-gray-200' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;