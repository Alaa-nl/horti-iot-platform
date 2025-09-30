import React from 'react';
import Header from './Header';
import HoverSidebar from './HoverSidebar';

interface LayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebarContent }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HoverSidebar additionalContent={sidebarContent} />
      <div className="flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;