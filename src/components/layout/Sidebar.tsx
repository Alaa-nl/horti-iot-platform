import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const researcherNavItems = [
    { name: 'Dashboard', href: '/researcher', icon: '📊' },
    { name: 'Statistics', href: '/researcher/statistics', icon: '📈' }
  ];

  const growerNavItems = [
    { name: 'Dashboard', href: '/grower', icon: '💼' }
  ];

  const navItems = user?.role === 'researcher' ? researcherNavItems : growerNavItems;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-b from-green-50 to-white w-64 min-h-screen border-r border-green-200 p-4"
    >
      {/* User Profile Section */}
      <div className="mb-6 pb-4 border-b border-green-200">
        <Link to="/profile" className="block p-3 bg-green-100 rounded-lg hover:bg-green-200 transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-600 capitalize">{user?.role || 'Role'}</p>
            </div>
          </div>
        </Link>
      </div>

      <nav className="space-y-2">
        {navItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.href}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>
    </motion.div>
  );
};

export default Sidebar;