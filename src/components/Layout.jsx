import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, Heart, Smile, Target, User, LogOut, CheckCircle, BookOpen, Users, Clock, Settings as SettingsIcon, Menu, X, Trophy, Repeat, Droplet, Scale, Moon, Sun } from 'lucide-react';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import useStore from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Layout = ({ children }) => {
  const location = useLocation();
  const { user, clearUser, userStats } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // mobileMenuOpen is used for the tablet (md) bottom-sheet menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/finance', icon: Wallet, label: 'Finance' },
    { path: '/recurring', icon: Repeat, label: 'Recurring' },
    { path: '/health', icon: Heart, label: 'Health' },
    { path: '/mood', icon: Smile, label: 'Mood' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/habits', icon: CheckCircle, label: 'Habits' },
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/challenges', icon: Trophy, label: 'Challenges' },
    { path: '/water', icon: Droplet, label: 'Water' },
    { path: '/weight', icon: Scale, label: 'Weight' },
    { path: '/social', icon: Users, label: 'Social' },
    { path: '/analytics', icon: Clock, label: 'Analytics' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  const isDark = theme === 'dark' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Theme Toggle Button */}
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 hidden md:flex lg:flex"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      {/* Hamburger toggle for tablet (md) - opens bottom-sheet menu; hidden on desktop */}
      <button
        aria-label="Open navigation"
        onClick={() => setMobileMenuOpen(true)}
        className="hidden md:inline-flex lg:hidden fixed top-4 left-4 z-50 items-center justify-center w-10 h-10 rounded-lg bg-card/60 hover:bg-card border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Drawer overlay (mobile) - visible below md */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 dark:bg-black/50 transition-opacity md:hidden ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />

  {/* Drawer content for mobile (slides in from left) */}
  <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card/50 backdrop-blur-xl border-r border-border px-6 pb-4 h-full">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>TrackitAll</h1>
                <p className="text-xs text-muted-foreground">Student Dashboard</p>
              </div>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-md hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>

          {user && (
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName || 'Student'}</p>
                  <p className="text-xs text-muted-foreground">Level {userStats.level}</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600"
                  style={{ width: `${(userStats.points % 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{userStats.points} / {userStats.level * 100} XP</p>
            </div>
          )}

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      data-testid={`nav-drawer-${item.label.toLowerCase()}`}
                      onClick={() => setDrawerOpen(false)}
                      className={`group flex gap-x-3 rounded-xl p-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  data-testid="logout-button-drawer"
                  className="w-full group flex gap-x-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-rose-500/10 transition-all"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card/50 backdrop-blur-xl border-r border-border px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>TrackitAll</h1>
              <p className="text-xs text-slate-500">Student Dashboard</p>
            </div>
          </div>
          
          {user && (
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName || 'Student'}</p>
                  <p className="text-xs text-muted-foreground">Level {userStats.level}</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600"
                  style={{ width: `${(userStats.points % 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{userStats.points} / {userStats.level * 100} XP</p>
            </div>
          )}

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                      className={`group flex gap-x-3 rounded-xl p-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="w-full group flex gap-x-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-rose-500/10 transition-all"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="py-4 px-0 pb-20 sm:pb-24 lg:pb-6">
          {/* Add safe area for mobile so fixed bottom nav doesn't overlap content */}
          <style>{`@media (max-width: 768px) { main { padding-bottom: calc(env(safe-area-inset-bottom) + 5rem); } }`}</style>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile floating button (opens drawer) - visible below md */}
      <div className="fixed bottom-4 right-4 z-50 md:hidden flex gap-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-lg"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <button
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-violet-600 text-white shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Tablet bottom-sheet menu (visible at md only) */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 dark:bg-black/50 md:block lg:hidden transition-opacity ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      {/* Bottom sheet menu for tablet */}
      <div className={`fixed inset-x-0 bottom-0 z-50 md:block lg:hidden transform transition-transform ${mobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="bg-card/95 backdrop-blur-lg border-t border-border rounded-t-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Menu</h3>
                <p className="text-xs text-muted-foreground">Navigate</p>
              </div>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-md hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav>
            <ul className="grid grid-cols-3 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-center ${isActive ? 'text-violet-400 bg-muted/50' : 'text-muted-foreground hover:bg-muted'}`}
                      data-testid={`mobile-menu-${item.label.toLowerCase()}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-4">
            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-rose-600 text-white">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};