import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'admin': return 'Admin Dashboard';
      case 'researcher': return 'Research Dashboard';
      case 'grower': return 'Business Dashboard';
      case 'farmer': return 'Farm Dashboard';
      default: return 'Dashboard';
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gradient-to-r from-horti-green-500 to-horti-blue-500 rounded-lg"></div>
          <h1 className="text-xl font-semibold text-gray-900">
            HORTI-IOT {getDashboardTitle()}
          </h1>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </motion.header>
  );
};

export default Header;