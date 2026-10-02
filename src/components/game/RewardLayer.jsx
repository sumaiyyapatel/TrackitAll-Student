import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore, { leagueInfo } from '@/store/useGameStore';
import { Mascot } from '@/components/game/Mascot';
import { Confetti, StreakWeek, GoalRing } from '@/components/game/widgets';
import { Button } from '@/components/ui/button';
import { ACHIEVEMENTS, TIER_NAMES, TIER_STYLES } from '@/lib/game/rules';
import { playSound, vibrate } from '@/lib/game/sound';

const TOAST_KINDS = new Set(['xp', 'quest']);

// Floating "+10 XP" and quest-complete toasts
const Toasts = ({ items, onDone }) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 md:bottom-8">
    <AnimatePresence>
      {items.map(e => (
        <ToastItem key={e.id} event={e} onDone={onDone} />
      ))}
    </AnimatePresence>
  </div>
);

const ToastItem = ({ event, onDone }) => {
  useEffect(() => {
    const t = setTimeout(() => onDone(event.id), event.kind === 'quest' ? 2600 : 1500);
    return () => clearTimeout(t);
  }, [event, onDone]);

  useEffect(() => {
    if (event.kind === 'quest') playSound('quest');
  }, [event.kind]);

  if (event.kind === 'xp') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 30, scale: 0.6 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`flex items-center gap-2 rounded-2xl border-2 px-4 py-2 font-black shadow-xl ${event.capped
          ? 'border-border bg-card text-muted-foreground'
          : 'border-xp/60 bg-card text-xp'}`}
      >
        <motion.span animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 0.5 }}>⚡</motion.span>
        {event.capped ? `${event.label} · daily XP max reached` : `+${event.amount} XP`}
        {!event.capped && <span className="text-xs font-bold text-muted-foreground">{event.label}</span>}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 rounded-2xl border-2 border-gem/50 bg-card px-4 py-3 shadow-xl"
    >
      <motion.span className="text-2xl" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.5 }}>{event.emoji}</motion.span>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-gem">Quest complete!</p>
        <p className="text-sm font-extrabold">{event.title}</p>
      </div>
      <span className="ml-2 rounded-xl bg-gem/15 px-2 py-1 text-sm font-black text-gem">+{event.gems} 💎</span>
    </motion.div>
  );
};

// What each full-screen celebration shows
const sceneFor = (e) => {
  switch (e.kind) {
    case 'streak':
      return {
        mood: 'cheer', sound: 'streak', confetti: e.count > 1,
        hero: <BigNumber value={e.count} emoji="🔥" color="text-streak" />,
        title: e.count === 1 ? 'Streak started!' : `${e.count} day streak!`,
        body: e.freezeEarned
          ? 'You earned a streak freeze ❄️ — it protects your streak if you miss a day.'
          : e.count === 1 ? 'Log something every day to keep the flame alive.' : 'You showed up again. Keep it going!',
        extra: <StreakWeek className="mt-6 w-full max-w-xs" />,
      };
    case 'goal':
      return {
        mood: 'cheer', sound: 'success', confetti: true,
        hero: <GoalRing size={150} stroke={14} />,
        title: 'Daily goal complete!',
        body: `You earned ${e.xp} XP today. Here's +${e.gems} 💎 for showing up.`,
      };
    case 'level':
      return {
        mood: 'cheer', sound: 'levelup', confetti: true,
        hero: <BigNumber value={e.level} emoji="⭐" color="text-primary" label="LEVEL" />,
        title: `Level ${e.level}!`,
        body: 'Your consistency is paying off.',
      };
    case 'achievement': {
      const def = ACHIEVEMENTS.find(a => a.id === e.achievementId);
      return {
        mood: 'happy', sound: 'success', confetti: true,
        hero: (
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className={`flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br text-6xl shadow-[inset_0_-8px_0_rgba(0,0,0,0.25)] ${TIER_STYLES[e.tier]}`}
          >
            {def?.emoji}
          </motion.div>
        ),
        title: `${def?.name} ${['I', 'II', 'III'][e.tier]}`,
        body: `${TIER_NAMES[e.tier]} achievement unlocked — ${def?.desc(def.tiers[e.tier]).toLowerCase()}.`,
      };
    }
    case 'celebrate':
      return {
        mood: 'cheer', sound: 'success', confetti: true,
        hero: <BigNumber value="" emoji={e.emoji || '🎉'} color="text-primary" />,
        title: e.title,
        body: e.body,
      };
    case 'freeze':
      return {
        mood: 'happy', sound: 'freeze',
        hero: <BigNumber value={e.count} emoji="❄️" color="text-gem" />,
        title: 'Streak saved!',
        body: `You missed ${e.used === 1 ? 'a day' : `${e.used} days`}, but ${e.used === 1 ? 'a streak freeze' : 'streak freezes'} kept your ${e.count} day streak safe.`,
      };
    case 'streak-lost':
      return {
        mood: 'sad', sound: 'sad',
        hero: <BigNumber value={0} emoji="🧊" color="text-muted-foreground" />,
        title: 'Your streak ended',
        body: `You had a ${e.lost} day streak. Every streak starts with day one — log something today!`,
        cta: "Let's go",
      };
    case 'league': {
      const to = leagueInfo(e.to);
      const promoted = e.zone === 'promote';
      const demoted = e.zone === 'demote';
      return {
        mood: promoted ? 'cheer' : demoted ? 'sad' : 'happy',
        sound: promoted ? 'levelup' : demoted ? 'sad' : 'success',
        confetti: promoted,
        hero: <div className={`flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br text-6xl ${to.color}`}>{to.emoji}</div>,
        title: promoted ? `Promoted to ${to.name}!` : demoted ? `Moved to ${to.name}` : `You stayed in ${to.name}`,
        body: `You finished #${e.rank} last week.`,
      };
    }
    default:
      return null;
  }
};

const BigNumber = ({ value, emoji, color, label }) => (
  <div className="relative flex flex-col items-center">
    <motion.span
      className="text-7xl"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: [0, 1.3, 1], rotate: 0 }}
      transition={{ duration: 0.6 }}
    >
      {emoji}
    </motion.span>
    {label && <span className="mt-2 text-xs font-black tracking-[0.3em] text-muted-foreground">{label}</span>}
    <motion.span
      className={`text-6xl font-black ${color}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
    >
      {value}
    </motion.span>
  </div>
);

const Scene = ({ event, onContinue }) => {
  const scene = sceneFor(event);

  useEffect(() => {
    if (scene?.sound) playSound(scene.sound);
    vibrate([30, 40, 30]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') onContinue(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onContinue]);

  if (!scene) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={scene.title}
    >
      {scene.confetti && <Confetti burstKey={event.id} />}
      <motion.div
        className="flex w-full max-w-md flex-col items-center text-center"
        initial={{ y: 40, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <div className="mb-4">{scene.hero}</div>
        <Mascot mood={scene.mood} size={96} className="mb-2" />
        <h2 className="text-3xl font-black">{scene.title}</h2>
        <p className="mt-2 max-w-sm text-base text-muted-foreground">{scene.body}</p>
        {scene.extra}
        <Button size="lg" className="mt-8 w-full max-w-xs" onClick={onContinue} autoFocus>
          {scene.cta || 'Continue'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export const RewardLayer = () => {
  const events = useGameStore(s => s.events);
  const shiftEvent = useGameStore(s => s.shiftEvent);
  const [toastIds, setToastIds] = useState([]);

  const toasts = events.filter(e => TOAST_KINDS.has(e.kind));
  const scene = events.find(e => !TOAST_KINDS.has(e.kind));

  // Keep only a few toasts on screen at once
  useEffect(() => {
    setToastIds(toasts.slice(0, 3).map(t => t.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  return (
    <>
      <Toasts items={toasts.filter(t => toastIds.includes(t.id))} onDone={shiftEvent} />
      <AnimatePresence mode="wait">
        {scene && <Scene key={scene.id} event={scene} onContinue={() => shiftEvent(scene.id)} />}
      </AnimatePresence>
    </>
  );
};

export default RewardLayer;
