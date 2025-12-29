import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Target, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { NAVIGATION_CONFIG, getActiveTab } from '@/config/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export const MobileTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const activeTab = getActiveTab(location.pathname);

  const tabs = NAVIGATION_CONFIG.mobile.tabs;

  const handleTabClick = (tab) => {
    if (tab.id === 'more') {
      setMoreSheetOpen(true);
    } else if (tab.path) {
      navigate(tab.path);
    } else if (tab.routes && tab.routes.length > 0) {
      // Navigate to first route in the tab
      navigate(tab.routes[0].path);
    }
  };

  const handleRouteClick = (path) => {
    navigate(path);
    setMoreSheetOpen(false);
  };

  return (
    <>
      {/* Bottom Tab Navigation - Mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="grid grid-cols-4 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive 
                    ? 'text-violet-400 bg-violet-500/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Swipeable Track Tab Content */}
      {activeTab === 'track' && (
        <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-b border-border pt-16">
          <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
            {tabs.find(t => t.id === 'track')?.routes.map((route) => {
              const RouteIcon = route.icon;
              const isActive = location.pathname === route.path;
              
              return (
                <button
                  key={route.path}
                  onClick={() => navigate(route.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <RouteIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{route.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Swipeable Stats Tab Content */}
      {activeTab === 'stats' && (
        <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-b border-border pt-16">
          <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
            {tabs.find(t => t.id === 'stats')?.routes.map((route) => {
              const RouteIcon = route.icon;
              const isActive = location.pathname === route.path;
              
              return (
                <button
                  key={route.path}
                  onClick={() => navigate(route.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <RouteIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{route.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* More Sheet */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {tabs.find(t => t.id === 'more')?.routes.map((route) => {
              const RouteIcon = route.icon;
              const isActive = location.pathname === route.path;
              
              return (
                <button
                  key={route.path}
                  onClick={() => handleRouteClick(route.path)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-violet-600 text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RouteIcon className="w-5 h-5" />
                    <span className="font-medium">{route.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

