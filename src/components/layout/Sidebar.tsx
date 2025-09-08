import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const researcherNavItems = [
    { name: 'Dashboard', href: '/researcher', icon: '📊' }
  ];

  const growerNavItems = [
    { name: 'Dashboard', href: '/grower', icon: '💼' }
  ];

  const navItems = user?.role === 'researcher' ? researcherNavItems : growerNavItems;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white w-64 min-h-screen border-r border-gray-200 p-4"
    >
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
                    ? 'bg-horti-green-50 text-horti-green-700 border border-horti-green-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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