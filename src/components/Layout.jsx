import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wallet, Heart, Smile, Target, User, LogOut, CheckCircle, BookOpen, Users, Clock, Settings as SettingsIcon } from 'lucide-react';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import useStore from '@/store/useStore';
import { toast } from 'sonner';

export const Layout = ({ children }) => {
  const location = useLocation();
  const { user, clearUser, userStats } = useStore();

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
    { path: '/health', icon: Heart, label: 'Health' },
    { path: '/mood', icon: Smile, label: 'Mood' },
    { path: '/goals', icon: Target, label: 'Goals' },
    { path: '/habits', icon: CheckCircle, label: 'Habits' },
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/social', icon: Users, label: 'Social' },
    { path: '/analytics', icon: Clock, label: 'Analytics' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900/50 backdrop-blur-xl border-r border-white/5 px-6 pb-4">
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
                  <p className="text-xs text-slate-500">Level {userStats.level}</p>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-pink-600"
                  style={{ width: `${(userStats.points % 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{userStats.points} / {userStats.level * 100} XP</p>
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
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
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
                  className="w-full group flex gap-x-3 rounded-xl p-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-rose-500/10 transition-all"
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
        <main className="py-6 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-lg border-t border-white/10 flex justify-around items-center z-50 lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isActive ? 'text-violet-400' : 'text-slate-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};