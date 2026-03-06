/**
 * Category Color System
 * Distinct color palettes for each major tracker category.
 * Each category has: bg, text, accent, border, gradient, iconBg
 */

export const CATEGORY_THEMES = {
  attendance: {
    label: 'Attendance',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    accent: 'text-violet-500',
    border: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-500/50',
    gradient: 'from-violet-600 to-purple-600',
    iconBg: 'bg-violet-600',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300',
    ring: 'ring-violet-500/30',
    hex: '#8b5cf6',
  },
  health: {
    label: 'Health',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    accent: 'text-emerald-500',
    border: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-600',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    ring: 'ring-emerald-500/30',
    hex: '#10b981',
  },
  mood: {
    label: 'Mood',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    accent: 'text-cyan-500',
    border: 'border-cyan-500/30',
    hoverBorder: 'hover:border-cyan-500/50',
    gradient: 'from-cyan-500 to-blue-600',
    iconBg: 'bg-cyan-600',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    ring: 'ring-cyan-500/30',
    hex: '#06b6d4',
  },
  finance: {
    label: 'Finance',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    accent: 'text-amber-500',
    border: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/50',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-600',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    ring: 'ring-amber-500/30',
    hex: '#f59e0b',
  },
  study: {
    label: 'Study',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    accent: 'text-indigo-500',
    border: 'border-indigo-500/30',
    hoverBorder: 'hover:border-indigo-500/50',
    gradient: 'from-indigo-500 to-blue-600',
    iconBg: 'bg-indigo-600',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    ring: 'ring-indigo-500/30',
    hex: '#6366f1',
  },
  habits: {
    label: 'Habits',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    accent: 'text-rose-500',
    border: 'border-rose-500/30',
    hoverBorder: 'hover:border-rose-500/50',
    gradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-600',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    ring: 'ring-rose-500/30',
    hex: '#f43f5e',
  },
};

/**
 * Get a category theme by key, with fallback
 */
export const getCategoryTheme = (category) => {
  return CATEGORY_THEMES[category] || CATEGORY_THEMES.attendance;
};
