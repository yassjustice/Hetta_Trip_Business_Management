import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />
      
      {/* Main content area - improved layout with proper z-index and overflow handling */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}>
        {/* Header with higher z-index */}
        <Header 
          setSidebarOpen={setSidebarOpen}
        />
        
        {/* Page content with proper overflow handling */}
        <main className="flex-1 py-6 min-h-0 relative z-0 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 max-w-full mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
