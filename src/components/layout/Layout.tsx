import React, { useState } from 'react';
import Header from './Header';
import HoverSidebar from './HoverSidebar';

interface LayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebarContent }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <HoverSidebar
        additionalContent={sidebarContent}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;