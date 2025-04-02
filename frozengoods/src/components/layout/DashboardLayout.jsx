import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function DashboardLayout() {
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const handleSidebarStateChange = useCallback((state) => {
    setExpanded(state.expanded);
    setIsMobile(state.isMobile);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onStateChange={handleSidebarStateChange} />
      <main 
        className={`
          flex-1 overflow-y-auto p-6 transition-all duration-300
          ${expanded ? 'md:ml-64' : 'ml-20'}
          ${isMobile ? 'ml-0' : ''}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout; 