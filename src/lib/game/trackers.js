import {
  Calendar, Wallet, Heart, Smile, Target, CheckCircle, BookOpen, Users,
  BarChart3, Trophy, Repeat, Droplet, Scale, Settings as SettingsIcon
} from 'lucide-react';

// Every tracker in the app. Drives navigation, the tracker picker and the Today tiles.
// `color` is a full Tailwind class set so the JIT compiler can see it.
export const TRACKERS = [
  {
    id: 'attendance', label: 'Attendance', path: '/attendance', emoji: '🎓', icon: Calendar,
    group: 'School', blurb: 'Mark your classes',
    color: { bg: 'bg-violet-500', soft: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/50' },
  },
  {
    id: 'study', label: 'Study', path: '/study', emoji: '📚', icon: BookOpen,
    group: 'School', blurb: 'Sessions, exams & focus timer',
    color: { bg: 'bg-sky-500', soft: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/50' },
  },
  {
    id: 'habits', label: 'Habits', path: '/habits', emoji: '✅', icon: CheckCircle,
    group: 'Growth', blurb: 'Daily check-ins',
    color: { bg: 'bg-lime-500', soft: 'bg-lime-500/15', text: 'text-lime-400', border: 'border-lime-500/50' },
  },
  {
    id: 'goals', label: 'Goals', path: '/goals', emoji: '🎯', icon: Target,
    group: 'Growth', blurb: 'Big things, step by step',
    color: { bg: 'bg-rose-500', soft: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/50' },
  },
  {
    id: 'challenges', label: 'Challenges', path: '/challenges', emoji: '🏆', icon: Trophy,
    group: 'Growth', blurb: 'Push yourself',
    color: { bg: 'bg-amber-500', soft: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/50' },
  },
  {
    id: 'mood', label: 'Mood', path: '/mood', emoji: '😊', icon: Smile,
    group: 'Mind & Body', blurb: 'How are you feeling?',
    color: { bg: 'bg-fuchsia-500', soft: 'bg-fuchsia-500/15', text: 'text-fuchsia-400', border: 'border-fuchsia-500/50' },
  },
  {
    id: 'health', label: 'Health', path: '/health', emoji: '💪', icon: Heart,
    group: 'Mind & Body', blurb: 'Workouts, sleep & steps',
    color: { bg: 'bg-emerald-500', soft: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  },
  {
    id: 'water', label: 'Water', path: '/water', emoji: '💧', icon: Droplet,
    group: 'Mind & Body', blurb: 'Stay hydrated',
    color: { bg: 'bg-cyan-500', soft: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  },
  {
    id: 'weight', label: 'Weight', path: '/weight', emoji: '⚖️', icon: Scale,
    group: 'Mind & Body', blurb: 'Track your progress',
    color: { bg: 'bg-teal-500', soft: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/50' },
  },
  {
    id: 'finance', label: 'Finance', path: '/finance', emoji: '💸', icon: Wallet,
    group: 'Money', blurb: 'Spending & income',
    color: { bg: 'bg-green-500', soft: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/50' },
  },
  {
    id: 'recurring', label: 'Recurring', path: '/recurring', emoji: '🔁', icon: Repeat,
    group: 'Money', blurb: 'Subscriptions & bills',
    color: { bg: 'bg-orange-500', soft: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/50' },
  },
];

// Pages that aren't trackers but still live in the app
export const TOOLS = [
  {
    id: 'analytics', label: 'Analytics', path: '/analytics', emoji: '📊', icon: BarChart3,
    blurb: 'Where your time goes',
    color: { bg: 'bg-indigo-500', soft: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/50' },
  },
  {
    id: 'social', label: 'Friends', path: '/social', emoji: '👥', icon: Users,
    blurb: 'Friends & requests',
    color: { bg: 'bg-pink-500', soft: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/50' },
  },
  {
    id: 'settings', label: 'Settings', path: '/settings', emoji: '⚙️', icon: SettingsIcon,
    blurb: 'Goal, sounds & reminders',
    color: { bg: 'bg-slate-500', soft: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/50' },
  },
];

export const TRACKER_GROUPS = ['School', 'Growth', 'Mind & Body', 'Money'];

export const DEFAULT_TRACKERS = ['attendance', 'study', 'habits', 'mood', 'water', 'finance'];

export const getTracker = (id) => TRACKERS.find(t => t.id === id) || TOOLS.find(t => t.id === id);

export const getPageMeta = (path) =>
  [...TRACKERS, ...TOOLS].find(t => t.path === path);
