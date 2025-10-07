import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface HoverSidebarProps {
  children?: React.ReactNode;
  additionalContent?: React.ReactNode;
}

const HoverSidebar: React.FC<HoverSidebarProps> = ({ children, additionalContent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'researcher': return 'Researcher';
      case 'grower': return 'Farmer'; // Grower is treated as Farmer
      case 'farmer': return 'Farmer';
      default: return 'User';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500';
      case 'researcher': return 'bg-emerald-500';
      case 'grower': return 'bg-green-500'; // Grower uses same color as farmer
      case 'farmer': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/profile', label: '👤 My Profile', icon: '👤' }
    ];

    if (user?.role === 'admin') {
      return [
        { path: '/admin', label: '⚙️ Admin Dashboard', icon: '⚙️' },
        { path: '/researcher', label: '🔬 Researcher Dashboard', icon: '🔬' },
        { path: '/grower', label: '🏡 Grower/Investor Dashboard', icon: '🏡' },
        ...baseItems
      ];
    }

    if (user?.role === 'researcher') {
      return [
        { path: '/researcher', label: '🔬 Researcher Dashboard', icon: '🔬' },
        { path: '/grower', label: '🏡 Grower/Investor Dashboard', icon: '🏡' },
        ...baseItems
      ];
    }

    // Grower and Farmer are the same role
    if (user?.role === 'grower' || user?.role === 'farmer') {
      return [
        { path: '/grower', label: '🏡 Grower/Investor Dashboard', icon: '🏡' },
        { path: '/researcher', label: '🔬 Researcher Dashboard', icon: '🔬' },
        ...baseItems
      ];
    }

    return baseItems;
  };

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: 0
        }}
        className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto scrollbar-thin"
      >
        {/* User Profile */}
        <div className="p-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center mb-3">
              <div className="relative">
                {user?.profile_photo ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${user.profile_photo}`}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className={`w-12 h-12 ${getRoleColor(user?.role || '')} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                    {user ? user.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-gray-800 truncate">
                  {user ? user.name : 'Guest User'}
                </h3>
                <p className="text-xs text-blue-600 font-medium">
                  {user ? getRoleDisplayName(user.role) : 'Not Authenticated'}
                </p>
                {user?.email && (
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                )}
              </div>
            </div>
            {user?.bio && (
              <p className="text-xs text-gray-600 italic mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation</h3>
          <div className="space-y-2">
            {getNavigationItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {item.label}
                </span>
                <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Custom Children Content */}
        {children}
      </motion.div>

    </>
  );
};

export default HoverSidebar;