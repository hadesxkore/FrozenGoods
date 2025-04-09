import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Snowflake,
  BookmarkIcon,
  FileText,
  Calendar,
  BarChart2,
  DollarSign
} from "lucide-react";

export default function Sidebar({ onStateChange }) {
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  
  // Use refs to track previous values and prevent unnecessary updates
  const prevExpandedRef = useRef(expanded);
  const prevIsMobileRef = useRef(isMobile);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setExpanded(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notify parent component of state changes
  useEffect(() => {
    if (prevExpandedRef.current !== expanded || prevIsMobileRef.current !== isMobile) {
      if (onStateChange) {
        onStateChange({ expanded, isMobile });
      }
      prevExpandedRef.current = expanded;
      prevIsMobileRef.current = isMobile;
    }
  }, [expanded, isMobile, onStateChange]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/dashboard",
    },
    {
      title: "Products",
      icon: <Package className="h-5 w-5" />,
      path: "/products",
    },
    {
      title: "Transactions",
      icon: <ShoppingCart className="h-5 w-5" />,
      path: "/transactions",
    },
    {
      title: "Reservations",
      icon: <Calendar className="h-5 w-5" />,
      path: "/reservations",
    },
    {
      title: "Reorder",
      icon: <Package className="h-5 w-5" />,
      path: "/reorder",
    },
    {
      title: "Distributor",
      icon: <DollarSign className="h-5 w-5" />,
      path: "/distributor",
    },
    {
      title: "Reports",
      icon: <BarChart2 className="h-5 w-5" />,
      path: "/reports",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
    },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && expanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={handleToggle}
        />
      )}
      
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar/95 backdrop-blur-sm transition-all duration-300 ease-in-out shadow-lg",
          expanded ? "w-64" : "w-20",
          isMobile && !expanded ? "-translate-x-full" : "translate-x-0"
        )}
      >
        {/* Toggle button for mobile */}
        {isMobile && (
          <Button
            variant="default"
            size="icon"
            className="absolute -right-12 top-4 rounded-full shadow-md bg-primary hover:bg-primary/90 text-primary-foreground z-50"
            onClick={handleToggle}
          >
            {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
        
        <div className="flex flex-col h-full p-4 relative z-50">
          {/* Logo and toggle */}
          <div className="flex items-center justify-between mb-8 mt-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Snowflake className="h-5 w-5" />
              </div>
              {expanded && (
                <div className="flex flex-col">
                  <span className="text-lg font-bold tracking-tight leading-none">Frozen</span>
                  <span className="text-lg font-bold tracking-tight leading-none text-blue-600">Goods</span>
                </div>
              )}
            </div>
            
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="text-sidebar-foreground hover:bg-sidebar-accent/30"
              >
                <ChevronRight className={cn("h-5 w-5 transition-transform", !expanded && "rotate-180")} />
              </Button>
            )}
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return expanded ? (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent/30"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-md",
                    isActive && "bg-primary/20"
                  )}>
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                  {isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                </Link>
              ) : (
                <TooltipProvider key={item.path} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center justify-center h-12 w-12 rounded-lg mb-1 transition-all mx-auto relative",
                          isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent/30"
                        )}
                      >
                        <div className="flex items-center justify-center">
                          {item.icon}
                        </div>
                        {isActive && (
                          <div className="absolute left-0 w-1 h-12 bg-primary rounded-r-full" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>
          
          {/* User profile at bottom */}
          <div className="mt-auto pt-4 border-t border-sidebar-border">
            {expanded ? (
              <div className="flex items-center p-2 rounded-lg hover:bg-sidebar-accent/30 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary-foreground">
                    {currentUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium truncate">{currentUser?.name || "User"}</p>
                  <p className="text-xs truncate text-sidebar-foreground/70">{currentUser?.email}</p>
                </div>
              </div>
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary-foreground">
                          {currentUser?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{currentUser?.name || "User"}</p>
                    <p className="text-xs">{currentUser?.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {expanded ? (
              <Button
                variant="ghost"
                className="w-full mt-3 flex items-center justify-start text-sidebar-foreground hover:bg-sidebar-accent/30"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <span>Logout</span>
              </Button>
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 mx-auto mt-3 text-sidebar-foreground hover:bg-sidebar-accent/30"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Logout
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </aside>
    </>
  );
} 