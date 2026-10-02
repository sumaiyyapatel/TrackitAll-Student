import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import useGameStore from '@/store/useGameStore';
import { MAIN_NAV, sectionFor } from '@/config/navigation';
import { TRACKERS, TOOLS } from '@/lib/game/trackers';
import { StatBar, StreakPanel } from '@/components/game/StatBar';
import { QuestList, GoalRing } from '@/components/game/widgets';
import { Mascot } from '@/components/game/Mascot';
import { cn } from '@/lib/utils';

const Logo = () => (
  <Link to="/dashboard" className="flex items-center gap-2" aria-label="TrackitAll home">
    <Mascot mood="idle" size={36} />
    <span className="hidden text-2xl font-black tracking-tight text-primary sm:inline lg:inline">trackitall</span>
  </Link>
);

const SideItem = ({ to, emoji, label, active, small }) => (
  <Link
    to={to}
    data-testid={`nav-${label.toLowerCase()}`}
    className={cn(
      'group flex items-center gap-4 rounded-2xl border-2 font-extrabold uppercase tracking-wider transition-colors',
      small ? 'px-3 py-1.5 text-xs normal-case tracking-normal' : 'px-4 py-2.5 text-sm',
      active
        ? 'border-primary/60 bg-primary/15 text-primary'
        : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
    )}
  >
    <span className={cn('transition-transform group-hover:scale-110 group-active:scale-95', small ? 'text-lg' : 'text-2xl')}>{emoji}</span>
    {label}
  </Link>
);

const Sidebar = ({ pathname }) => {
  const enabled = useGameStore(s => s.settings.trackers);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches);
  const section = sectionFor(pathname);
  const myTrackers = TRACKERS.filter(t => enabled.includes(t.id));

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r-2 border-border bg-background">
      <div className="flex h-full flex-col gap-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <div className="mb-6 px-2"><Logo /></div>
        {MAIN_NAV.map(item => (
          <SideItem key={item.path} to={item.path} emoji={item.emoji} label={item.label} active={section === item.path && (item.path !== '/track' || pathname === '/track')} />
        ))}

        {myTrackers.length > 0 && (
          <>
            <p className="mb-1 mt-6 px-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Your trackers</p>
            {myTrackers.map(t => (
              <SideItem key={t.id} to={t.path} emoji={t.emoji} label={t.label} active={pathname === t.path} small />
            ))}
          </>
        )}

        <p className="mb-1 mt-6 px-4 text-[11px] font-black uppercase tracking-widest text-muted-foreground">More</p>
        {TOOLS.map(t => (
          <SideItem key={t.id} to={t.path} emoji={t.emoji} label={t.label} active={pathname === t.path} small />
        ))}

        <button
          onClick={toggleTheme}
          className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-extrabold text-muted-foreground hover:bg-muted"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'system' ? 'System theme' : isDark ? 'Dark mode' : 'Light mode'}
        </button>
      </div>
    </aside>
  );
};

const BottomTabs = ({ pathname }) => {
  const section = sectionFor(pathname);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-border bg-background/95 backdrop-blur lg:hidden" aria-label="Main">
      <div className="mx-auto grid max-w-lg grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {MAIN_NAV.map(item => {
          const active = section === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-col items-center gap-0.5 py-2"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-x-2 inset-y-1 rounded-2xl border-2 border-primary/60 bg-primary/15"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.span
                className="relative text-2xl"
                animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {item.emoji}
              </motion.span>
              <span className={cn('relative text-[10px] font-extrabold uppercase tracking-wider', active ? 'text-primary' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const RightRail = () => (
  <aside className="hidden 2xl:block 2xl:w-80 shrink-0">
    <div className="sticky top-24 space-y-4">
      <div className="duo-card p-4"><StreakPanel /></div>
      <div className="duo-card flex items-center gap-4 p-4">
        <GoalRing size={84} stroke={9} />
        <div>
          <p className="font-black">Daily goal</p>
          <Link to="/settings" className="text-xs font-extrabold text-primary">Change goal</Link>
        </div>
      </div>
      <div className="duo-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-black">Daily quests</p>
          <Link to="/quests" className="text-xs font-extrabold uppercase tracking-wider text-primary">View all</Link>
        </div>
        <QuestList compact />
      </div>
    </div>
  </aside>
);

export const Layout = ({ children, hideRail = false }) => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>

      <Sidebar pathname={pathname} />

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b-2 border-border bg-background/90 backdrop-blur lg:border-b-0 lg:bg-background/70">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:h-16 lg:justify-end lg:px-8">
            <div className="lg:hidden"><Logo /></div>
            <StatBar />
          </div>
        </header>

        <div className="mx-auto flex max-w-[1400px] gap-8 px-4 sm:px-6 lg:px-8">
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 pb-28 pt-4 lg:pb-12">
            <motion.div
              key={pathname}
              className="page-stagger"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>
          {!hideRail && <RightRail />}
        </div>
      </div>

      <BottomTabs pathname={pathname} />
    </div>
  );
};

export default Layout;
