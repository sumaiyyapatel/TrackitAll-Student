import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, RotateCcw, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { MascotSays } from '@/components/game/Mascot';
import { GoalRing, StreakWeek, QuestList } from '@/components/game/widgets';
import { RecentActivity } from '@/components/RecentActivity';
import { CatchUpModal } from '@/components/CatchUpModal';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { Button } from '@/components/ui/button';
import useStore from '@/store/useStore';
import useGameStore, { useToday } from '@/store/useGameStore';
import { db, collection, addDoc } from '@/lib/localDb';
import { TRACKERS } from '@/lib/game/trackers';
import { ACTIVITIES } from '@/lib/game/rules';
import { dayKey } from '@/lib/game/dates';
import { getGreeting } from '@/utils/helpers';
import { cn } from '@/lib/utils';

// Pip's message depends on where you are with your streak and goal
const usePipMessage = (name) => {
  const streak = useGameStore(s => s.streak);
  const goal = useGameStore(s => s.settings.dailyGoal);
  const today = useToday();
  const activeToday = streak.lastActive === dayKey();
  const evening = new Date().getHours() >= 18;
  const hi = `${getGreeting()}, ${name}!`;

  if (today.xp >= goal) return { mood: 'cheer', text: `Daily goal done! 🎉 Anything else today is bonus XP.` };
  if (activeToday) return { mood: 'happy', text: `${goal - today.xp} XP to your daily goal. You've got this!` };
  if (streak.current > 0 && evening) {
    return { mood: 'sleepy', text: `Psst… your ${streak.current} day streak is at risk! Log anything to keep it alive 🔥` };
  }
  if (streak.current > 0) return { mood: 'idle', text: `${hi} Keep your ${streak.current} day streak going — log something today.` };
  return { mood: 'happy', text: `${hi} Let's start a streak — log anything below to begin.` };
};

const trackerCount = (trackerId, counts) =>
  Object.entries(counts || {}).reduce((sum, [type, n]) => sum + (ACTIVITIES[type]?.tracker === trackerId ? n : 0), 0);

const TrackerTile = ({ tracker, count, index, onQuickAdd }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.05 * index, type: 'spring', stiffness: 400, damping: 26 }}
      className="relative"
    >
      <button
        onClick={() => navigate(tracker.path)}
        className="duo-tile group flex w-full flex-col items-center gap-2 px-3 pb-3 pt-4 text-center"
        data-testid={`tile-${tracker.id}`}
      >
        <span className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full text-3xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] transition-transform group-hover:scale-110 group-hover:-rotate-6',
          tracker.color.bg
        )}>
          {tracker.emoji}
        </span>
        <span className="text-sm font-extrabold">{tracker.label}</span>
        <span className={cn('text-[11px] font-bold', count > 0 ? tracker.color.text : 'text-muted-foreground')}>
          {count > 0 ? `✓ ${count} today` : tracker.blurb}
        </span>
      </button>
      {onQuickAdd && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onQuickAdd}
          className={cn('absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]', tracker.color.bg)}
          aria-label={`Quick add ${tracker.label}`}
        >
          <Plus className="h-4 w-4" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default function Today() {
  const { user } = useStore();
  const enabled = useGameStore(s => s.settings.trackers);
  const streak = useGameStore(s => s.streak);
  const recordActivity = useGameStore(s => s.recordActivity);
  const today = useToday();
  const [showCatchUp, setShowCatchUp] = useState(false);
  const firstName = user?.displayName?.split(' ')[0] || 'friend';
  const pip = usePipMessage(firstName);
  const myTrackers = TRACKERS.filter(t => enabled.includes(t.id));

  const quickWater = async () => {
    try {
      await addDoc(collection(db, 'water_intake'), { glasses: 1, date: new Date().toISOString(), userId: user.uid });
      recordActivity('water');
      const glasses = (today.counts?.water || 0) + 1;
      if (glasses === 8) recordActivity('water_goal');
    } catch (error) {
      console.error('Error adding water:', error);
      toast.error('Failed to log water');
    }
  };

  return (
    <Layout hideRail>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Hero: Pip + daily goal */}
        <section className="duo-card flex flex-col items-center gap-6 p-5 sm:flex-row sm:p-6">
          <MascotSays mood={pip.mood} size={96} className="flex-1">{pip.text}</MascotSays>
          <GoalRing size={124} stroke={13} />
        </section>

        {/* Streak */}
        <section className="duo-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                className={cn('text-3xl', streak.lastActive !== dayKey() && 'grayscale')}
                animate={streak.lastActive === dayKey() ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                🔥
              </motion.span>
              <div>
                <p className="text-lg font-black leading-tight">{streak.current} day streak</p>
                <p className="text-xs text-muted-foreground">Longest: {streak.longest} · ❄️ {streak.freezes} freeze{streak.freezes === 1 ? '' : 's'}</p>
              </div>
            </div>
          </div>
          <StreakWeek />
        </section>

        {/* Trackers */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-black">Log something</h2>
            <Link to="/track" className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-primary">
              <Settings2 className="h-4 w-4" /> Edit
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {myTrackers.map((t, i) => (
              <TrackerTile
                key={t.id}
                tracker={t}
                index={i}
                count={trackerCount(t.id, today.counts)}
                onQuickAdd={t.id === 'water' ? quickWater : undefined}
              />
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * myTrackers.length }}>
              <Link to="/track" className="duo-tile flex h-full min-h-[136px] flex-col items-center justify-center gap-2 border-dashed text-muted-foreground">
                <Plus className="h-7 w-7" />
                <span className="text-sm font-extrabold">Add tracker</span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Quests */}
        <section className="duo-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Daily quests</h2>
            <Link to="/quests" className="text-xs font-extrabold uppercase tracking-wider text-primary">View all</Link>
          </div>
          <QuestList />
        </section>

        {/* Recent */}
        <CollapsibleSection title="Recent activity" summary="Your latest entries across trackers" defaultOpen={false}>
          <RecentActivity />
        </CollapsibleSection>

        <Button variant="outline" className="w-full" onClick={() => setShowCatchUp(true)} data-testid="catch-up-button">
          <RotateCcw className="h-4 w-4" /> Catch up on missed days
        </Button>
        <CatchUpModal isOpen={showCatchUp} setIsOpen={setShowCatchUp} />
      </div>
    </Layout>
  );
}
