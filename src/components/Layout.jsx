import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import useStore from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Moon, Sun, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { NAVIGATION_CONFIG, getAllNavItems, getActiveTab } from '@/config/navigation';
import { MobileTabs } from '@/components/MobileTabs';
import { MilestoneContainer } from '@/components/GamificationWidgets';

export const Layout = ({ children }) => {
  const location = useLocation();
  const { user, clearUser, userStats } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const isDark = theme === 'dark' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches);
  const allNavItems = getAllNavItems();

  // Check if current path is active
  const isActive = (path) => location.pathname === path;

  // User Profile Card Component (reusable)
  const UserProfileCard = ({ className = '' }) => (
    user && (
      <div className={`bg-muted/50 rounded-2xl p-4 border border-border ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white font-semibold">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.displayName || 'Student'}</p>
            <p className="text-xs text-muted-foreground">Level {userStats.level}</p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-[#8b5cf6] transition-all duration-300"
            style={{ width: `${(userStats.points % 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{userStats.points} / {userStats.level * 100} XP</p>
      </div>
    )
  );

  // Navigation Item Component (reusable)
  const NavItem = ({ item, onClick, className = '', testId }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <Link
        to={item.path}
        onClick={onClick}
        data-testid={testId || `nav-${item.label.toLowerCase()}`}
        className={`group flex gap-x-3 rounded-xl p-3 text-sm font-medium transition-all ${
          active
            ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        } ${className}`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip to content for keyboard navigation */}
      <a href="#main-content" className="skip-to-content" tabIndex={0}>
        Skip to main content
      </a>

      {/* Milestone notifications */}
      <MilestoneContainer />
      {/* Theme Toggle - Desktop & Tablet */}
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 hidden md:flex"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {/* Tablet Menu Toggle */}
      <button
        aria-label="Open navigation"
        onClick={() => setTabletMenuOpen(true)}
        className="hidden md:inline-flex lg:hidden fixed top-4 left-4 z-50 items-center justify-center w-10 h-10 rounded-lg bg-card/60 hover:bg-card border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar - Fixed Left */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card/50 backdrop-blur-xl border-r border-border px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6] flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>TrackitAll</h1>
              <p className="text-xs text-muted-foreground">Student Dashboard</p>
            </div>
          </div>

          {/* User Profile */}
          <UserProfileCard />

          {/* Theme Toggle in Sidebar */}
          <Button
            onClick={toggleTheme}
            variant="outline"
            className="w-full justify-start mb-2"
          >
            {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Button>

          {/* Navigation - Grouped Sections */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-6">
              {NAVIGATION_CONFIG.desktop.map((section, sectionIdx) => (
                <li key={section.section}>
                  <div className="mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                      {section.section}
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <NavItem item={item} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              
              {/* Logout */}
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="w-full group flex gap-x-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-danger/10 transition-all"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Tablet Bottom Sheet Menu */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:block lg:hidden ${
          tabletMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setTabletMenuOpen(false)}
        aria-hidden={!tabletMenuOpen}
      />

      <div className={`fixed inset-x-0 bottom-0 z-50 md:block lg:hidden transform transition-transform ${
        tabletMenuOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-card/95 backdrop-blur-lg border-t border-border rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8b5cf6] flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Menu</h3>
                <p className="text-xs text-muted-foreground">Navigate</p>
              </div>
            </div>
            <button onClick={() => setTabletMenuOpen(false)} className="p-2 rounded-md hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile in Tablet Menu */}
          <div className="mb-4">
            <UserProfileCard />
          </div>

          {/* Grid-based Navigation */}
          <nav>
            <ul className="grid grid-cols-3 gap-2">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setTabletMenuOpen(false)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-colors ${
                        active 
                          ? 'text-violet-400 bg-violet-500/10' 
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      data-testid={`tablet-menu-${item.label.toLowerCase()}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout in Tablet Menu */}
          <div className="mt-4 pt-4 border-t border-border">
            <button 
              onClick={() => { setTabletMenuOpen(false); handleLogout(); }} 
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-danger text-white hover:opacity-90 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main id="main-content" tabIndex={-1} className={`py-4 px-0 md:pb-6 lg:pb-6 ${
          // Add top padding on mobile when Track or Stats tab is active (for swipeable header)
          (() => {
            const activeTab = getActiveTab(location.pathname);
            const needsTopPadding = activeTab === 'track' || activeTab === 'stats';
            return needsTopPadding ? 'pb-20 pt-20 md:pt-4' : 'pb-20 md:pt-4';
          })()
        }`}>
          <div className="max-w-container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <MobileTabs />
    </div>
  );
};
