import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 px-6 py-4 sticky top-0 z-40 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gradient-to-br from-horti-green-500 to-horti-green-600 rounded-xl flex items-center justify-center shadow-glow-green">
            <span className="text-xl">🌱</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-horti-green-600 to-horti-blue-600 bg-clip-text text-transparent">
              HORTI-IOT
            </h1>
            <p className="text-xs text-gray-600 font-medium">{getDashboardTitle()}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center px-5 py-2.5 border border-red-200 shadow-soft text-sm font-medium rounded-xl text-red-700 bg-white hover:bg-red-50 hover:border-red-300 hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-red-500/50 active:scale-95 transition-all duration-200"
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