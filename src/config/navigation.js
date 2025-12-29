import { 
  LayoutDashboard, 
  Calendar, 
  Wallet, 
  Heart, 
  Smile, 
  Target, 
  User, 
  CheckCircle, 
  BookOpen, 
  Users, 
  Clock, 
  Settings as SettingsIcon, 
  Trophy, 
  Repeat, 
  Droplet, 
  Scale 
} from 'lucide-react';

// Single source of truth for navigation
export const NAVIGATION_CONFIG = {
  // Desktop: Grouped sections
  desktop: [
    {
      section: 'Main',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
      ]
    },
    {
      section: 'Tracking',
      items: [
        { path: '/attendance', icon: Calendar, label: 'Attendance' },
        { path: '/finance', icon: Wallet, label: 'Finance' },
        { path: '/recurring', icon: Repeat, label: 'Recurring' },
        { path: '/health', icon: Heart, label: 'Health' },
        { path: '/water', icon: Droplet, label: 'Water' },
        { path: '/weight', icon: Scale, label: 'Weight' }
      ]
    },
    {
      section: 'Goals & Habits',
      items: [
        { path: '/goals', icon: Target, label: 'Goals' },
        { path: '/habits', icon: CheckCircle, label: 'Habits' },
        { path: '/challenges', icon: Trophy, label: 'Challenges' }
      ]
    },
    {
      section: 'Analytics',
      items: [
        { path: '/mood', icon: Smile, label: 'Mood' },
        { path: '/study', icon: BookOpen, label: 'Study' },
        { path: '/analytics', icon: Clock, label: 'Analytics' }
      ]
    },
    {
      section: 'Social & Settings',
      items: [
        { path: '/social', icon: Users, label: 'Social' },
        { path: '/settings', icon: SettingsIcon, label: 'Settings' },
        { path: '/profile', icon: User, label: 'Profile' }
      ]
    }
  ],
  
  // Mobile: Tab-based navigation
  mobile: {
    tabs: [
      {
        id: 'home',
        label: 'Home',
        icon: LayoutDashboard,
        path: '/dashboard'
      },
      {
        id: 'track',
        label: 'Track',
        icon: Calendar,
        routes: [
          { path: '/attendance', icon: Calendar, label: 'Attendance' },
          { path: '/finance', icon: Wallet, label: 'Finance' },
          { path: '/health', icon: Heart, label: 'Health' }
        ]
      },
      {
        id: 'stats',
        label: 'Stats',
        icon: Target,
        routes: [
          { path: '/mood', icon: Smile, label: 'Mood' },
          { path: '/goals', icon: Target, label: 'Goals' },
          { path: '/analytics', icon: Clock, label: 'Analytics' }
        ]
      },
      {
        id: 'more',
        label: 'More',
        icon: SettingsIcon,
        routes: [
          { path: '/recurring', icon: Repeat, label: 'Recurring' },
          { path: '/habits', icon: CheckCircle, label: 'Habits' },
          { path: '/study', icon: BookOpen, label: 'Study' },
          { path: '/challenges', icon: Trophy, label: 'Challenges' },
          { path: '/water', icon: Droplet, label: 'Water' },
          { path: '/weight', icon: Scale, label: 'Weight' },
          { path: '/social', icon: Users, label: 'Social' },
          { path: '/settings', icon: SettingsIcon, label: 'Settings' },
          { path: '/profile', icon: User, label: 'Profile' }
        ]
      }
    ]
  }
};

// Flattened list for tablet and other uses
export const getAllNavItems = () => {
  return NAVIGATION_CONFIG.desktop.flatMap(section => section.items);
};

// Get active tab for mobile
export const getActiveTab = (pathname) => {
  const tabs = NAVIGATION_CONFIG.mobile.tabs;
  
  // Check if pathname matches a tab's main path
  for (const tab of tabs) {
    if (tab.path === pathname) {
      return tab.id;
    }
    // Check if pathname matches any route in the tab
    if (tab.routes) {
      for (const route of tab.routes) {
        if (route.path === pathname) {
          return tab.id;
        }
      }
    }
  }
  
  return 'home'; // default
};

