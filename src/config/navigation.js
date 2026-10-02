// Main sections, shared by the desktop sidebar and the mobile tab bar
export const MAIN_NAV = [
  { path: '/dashboard', label: 'Today', emoji: '🏠' },
  { path: '/track', label: 'Track', emoji: '🧭' },
  { path: '/quests', label: 'Quests', emoji: '📜' },
  { path: '/league', label: 'League', emoji: '🏆' },
  { path: '/profile', label: 'Profile', emoji: '🐣' },
];

// Which main section a route belongs to (tracker pages live under "Track")
export const sectionFor = (pathname) => {
  const direct = MAIN_NAV.find(n => n.path === pathname);
  if (direct) return direct.path;
  if (pathname === '/settings') return '/profile';
  return '/track';
};
