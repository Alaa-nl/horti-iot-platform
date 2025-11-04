import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import ThemeToggle from '../common/ThemeToggle';
import { Button } from '../ui/button';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
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
      className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 sticky top-0 z-40"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>

          <div className="h-10 w-10 bg-gradient-to-br from-horti-green-500 to-horti-green-600 rounded-xl flex items-center justify-center shadow-glow-green">
            <span className="text-xl">🌱</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-horti-green-600 bg-clip-text text-transparent">
              HORTI-IOT
            </h1>
            <p className="text-xs font-medium text-muted-foreground">
              {getDashboardTitle()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <ThemeToggle />

          <Button
            variant="outline"
            onClick={logout}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;