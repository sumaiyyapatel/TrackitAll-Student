import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Pencil, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { Mascot } from '@/components/game/Mascot';
import { AchievementBadge, useAchievementRows } from '@/components/game/widgets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import useStore from '@/store/useStore';
import useGameStore, { leagueInfo } from '@/store/useGameStore';
import { db, doc, setDoc } from '@/lib/localDb';
import { levelProgress } from '@/lib/game/rules';
import { dayKey, addDays, weekStartKey } from '@/lib/game/dates';
import { cn } from '@/lib/utils';

const Stat = ({ emoji, value, label, className }) => (
  <div className="duo-card flex items-center gap-3 p-4">
    <span className="text-3xl">{emoji}</span>
    <div className="min-w-0">
      <p className={cn('text-xl font-black leading-tight', className)}>{value}</p>
      <p className="truncate text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  </div>
);

// Last 10 weeks, one column per week, coloured by XP earned
const ActivityCalendar = () => {
  const days = useGameStore(s => s.days);
  const goal = useGameStore(s => s.settings.dailyGoal);
  const today = dayKey();
  const start = addDays(weekStartKey(today), -63);

  const weeks = useMemo(() => Array.from({ length: 10 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))), [start]);

  const shade = (k) => {
    const d = days[k];
    if (k > today) return 'bg-transparent';
    if (d?.frozen && !d.xp) return 'bg-gem/50';
    if (!d?.xp) return 'bg-muted';
    if (d.xp >= goal) return 'bg-primary';
    return d.xp >= goal / 2 ? 'bg-primary/60' : 'bg-primary/30';
  };

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map((k, di) => (
              <motion.div
                key={k}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.006 }}
                className={cn('h-4 w-4 rounded-[5px] sm:h-5 sm:w-5', shade(k), k === today && 'ring-2 ring-streak')}
                title={`${k}: ${days[k]?.xp || 0} XP`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
        Less <span className="h-3 w-3 rounded bg-muted" /><span className="h-3 w-3 rounded bg-primary/30" /><span className="h-3 w-3 rounded bg-primary/60" /><span className="h-3 w-3 rounded bg-primary" /> Goal met
        <span className="ml-3 h-3 w-3 rounded bg-gem/50" /> Frozen
      </div>
    </div>
  );
};

export default function Profile() {
  const { user, setUser, clearUser } = useStore();
  const totalXP = useGameStore(s => s.totalXP);
  const streak = useGameStore(s => s.streak);
  const gems = useGameStore(s => s.gems);
  const tier = useGameStore(s => s.league.tier);
  const rows = useAchievementRows();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || '');
  const lp = levelProgress(totalXP);
  const league = leagueInfo(tier);
  const topBadges = [...rows].sort((a, b) => b.tier - a.tier || b.value / b.def.tiers[0] - a.value / a.def.tiers[0]).slice(0, 4);

  const saveName = async (e) => {
    e.preventDefault();
    const displayName = name.trim();
    if (!displayName) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName }, { merge: true });
      setUser({ ...user, displayName });
      setEditing(false);
      toast.success('Name updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const logout = () => {
    clearUser();
    toast.success('Logged out — your data stays on this device');
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <section className="duo-card relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary/40 via-fuchsia-500/30 to-sky-500/30" />
          <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-4xl font-black text-white shadow-[inset_0_-6px_0_rgba(0,0,0,0.2)]"
            >
              {user?.displayName?.[0]?.toUpperCase() || '🐣'}
            </motion.div>
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <form onSubmit={saveName} className="flex gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} autoFocus aria-label="Display name" />
                  <Button type="submit">Save</Button>
                </form>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-3xl font-black">{user?.displayName || 'Student'}</h1>
                  <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Edit name">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">Level {lp.level} · {league.name} League</p>
            </div>
            <Mascot mood="happy" size={72} className="hidden sm:block" />
          </div>
          <div className="relative mt-5">
            <div className="mb-1.5 flex justify-between text-xs font-extrabold text-muted-foreground">
              <span>Level {lp.level}</span>
              <span>{lp.into}/{lp.needed} XP to level {lp.level + 1}</span>
            </div>
            <Progress value={lp.pct} />
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="mb-3 text-xl font-black">Statistics</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat emoji="🔥" value={streak.current} label={`Day streak · best ${streak.longest}`} className="text-streak" />
            <Stat emoji="⚡" value={totalXP} label="Total XP" className="text-xp" />
            <Stat emoji={league.emoji} value={league.name} label="Current league" />
            <Stat emoji="💎" value={gems} label="Gems" className="text-gem" />
          </div>
        </section>

        {/* Calendar */}
        <section className="duo-card p-5">
          <h2 className="mb-4 text-xl font-black">Activity</h2>
          <ActivityCalendar />
        </section>

        {/* Achievements */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-black">Achievements</h2>
            <Link to="/quests" className="text-xs font-extrabold uppercase tracking-wider text-primary">View all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topBadges.map(r => <AchievementBadge key={r.def.id} {...r} size="sm" />)}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild variant="outline"><Link to="/settings"><Settings className="h-4 w-4" /> Settings</Link></Button>
          <Button variant="outline" onClick={logout} data-testid="logout-button"><LogOut className="h-4 w-4" /> Log out</Button>
        </div>
      </div>
    </Layout>
  );
}
