import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface HoverSidebarProps {
  children?: React.ReactNode;
  additionalContent?: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

const HoverSidebar: React.FC<HoverSidebarProps> = ({ children, additionalContent, isOpen = true, onToggle }) => {
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'researcher': return 'Researcher';
      case 'grower': return 'Farmer'; // Grower is treated as Farmer
      case 'farmer': return 'Farmer';
      default: return 'User';
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/algorithms', label: '🌱 Autonomous Greenhouse', icon: '🌱' },
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
          x: isOpen ? 0 : -320
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-80 bg-background/95 dark:bg-background/90 backdrop-blur-lg border-r border-border/50 z-50 shadow-xl"
      >
        <ScrollArea className="h-full"
>
        {/* User Profile */}
        <div className="p-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center mb-3">
              <div className="relative">
                {user?.profile_photo ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace('/api', '')}${user.profile_photo}`}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                    {user ? user.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-horti-green-500 rounded-full border-2 border-card"></div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {user ? user.name : 'Guest User'}
                </h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {user ? getRoleDisplayName(user.role) : 'Not Authenticated'}
                </Badge>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
                )}
              </div>
            </div>
            {user?.bio && (
              <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Navigation Menu */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Navigation</h3>
          <div className="space-y-2">
            {getNavigationItems().map((item) => (
              <Button
                key={item.path}
                asChild
                variant="outline"
                className="w-full justify-between h-auto py-3"
              >
                <Link to={item.path}>
                  <span className="text-sm font-medium">
                    {item.label}
                  </span>
                  <span>→</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Children Content */}
        {children}
        </ScrollArea>
      </motion.div>

    </>
  );
};

export default HoverSidebar;