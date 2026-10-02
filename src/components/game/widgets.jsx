import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Snowflake } from 'lucide-react';
import useGameStore, { todaysQuests, useToday } from '@/store/useGameStore';
import { dayKey, weekDays } from '@/lib/game/dates';
import { questProgress, ACHIEVEMENTS, TIER_NAMES, TIER_STYLES } from '@/lib/game/rules';
import { cn } from '@/lib/utils';

const CONFETTI_COLORS = ['#8b5cf6', '#f472b6', '#facc15', '#34d399', '#38bdf8', '#fb923c'];

/** One-shot confetti burst. Change `burstKey` to fire again. */
export const Confetti = ({ burstKey = 0, count = 70 }) => {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: `${burstKey}-${i}`,
    x: (Math.random() - 0.5) * 900,
    y: -(200 + Math.random() * 400),
    rotate: Math.random() * 720 - 360,
    delay: Math.random() * 0.15,
    size: 6 + Math.random() * 8,
    round: Math.random() > 0.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [burstKey, count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {pieces.map(p => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.size, height: p.round ? p.size : p.size * 0.45,
            background: p.color, borderRadius: p.round ? '9999px' : '2px',
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 900], opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: 2.2, delay: p.delay, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
};

/** Circular daily-goal progress */
export const GoalRing = ({ size = 112, stroke = 12, className = '' }) => {
  const goal = useGameStore(s => s.settings.dailyGoal);
  const today = useToday();
  const pct = Math.min(1, (today.xp || 0) / goal);
  const r = (size - stroke) / 2;
  const done = pct >= 1;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className={done ? 'stroke-xp' : 'stroke-primary'}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.max(pct, 0.001) }}
          transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-2xl">{done ? '🏆' : '⚡'}</span>
        <span className="mt-1 text-base font-black">{today.xp || 0}<span className="text-muted-foreground">/{goal}</span></span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">XP today</span>
      </div>
    </div>
  );
};

/** Mon–Sun strip: flame for active days, snowflake for frozen ones */
export const StreakWeek = ({ className = '' }) => {
  const days = useGameStore(s => s.days);
  const today = dayKey();
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className={cn('flex justify-between gap-1', className)}>
      {weekDays(today).map((k, i) => {
        const d = days[k];
        const active = (d?.counts && Object.keys(d.counts).length > 0);
        const frozen = d?.frozen;
        const isToday = k === today;
        const future = k > today;
        return (
          <div key={k} className="flex flex-col items-center gap-1.5">
            <span className={cn('text-[11px] font-extrabold', isToday ? 'text-streak' : 'text-muted-foreground')}>{labels[i]}</span>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 20 }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 text-base',
                active && 'border-streak bg-streak/90 text-white',
                !active && frozen && 'border-gem bg-gem/20 text-gem',
                !active && !frozen && isToday && 'border-dashed border-streak/70',
                !active && !frozen && !isToday && 'border-border bg-muted/40',
                future && 'opacity-50'
              )}
              title={k}
            >
              {active ? '🔥' : frozen ? <Snowflake className="h-4 w-4" /> : null}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

/** Today's quests with progress */
export const QuestList = ({ compact = false }) => {
  const state = useGameStore();
  const today = useToday();
  const quests = todaysQuests(state);

  return (
    <ul className="space-y-3">
      {quests.map((q, i) => {
        const value = questProgress(q, today);
        const done = value >= q.target;
        return (
          <motion.li
            key={q.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3"
          >
            <span className={cn(
              'flex shrink-0 items-center justify-center rounded-xl text-xl',
              compact ? 'h-9 w-9' : 'h-11 w-11',
              done ? 'bg-xp/20' : 'bg-muted'
            )}>
              {done ? '✨' : q.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('truncate font-extrabold', compact ? 'text-xs' : 'text-sm', done && 'text-muted-foreground line-through')}>{q.title}</p>
                <span className="shrink-0 text-xs font-extrabold text-gem">+{q.gems} 💎</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn('duo-shine h-full rounded-full', done ? 'bg-success' : 'bg-xp')}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / q.target) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-extrabold text-muted-foreground">
                  {done ? <Check className="ml-auto h-4 w-4 text-success" /> : `${value}/${q.target}`}
                </span>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
};

/** Tiered achievement tile */
export const AchievementBadge = ({ def, tier, value, size = 'md' }) => {
  const earned = tier >= 0;
  const nextTarget = def.tiers[Math.min(tier + 1, def.tiers.length - 1)];
  const maxed = tier >= def.tiers.length - 1;
  const pct = maxed ? 100 : Math.min(100, (value / nextTarget) * 100);

  return (
    <div className="duo-card flex items-center gap-4 p-4">
      <div className={cn(
        'relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-[inset_0_-4px_0_rgba(0,0,0,0.25)]',
        size === 'sm' ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-3xl',
        earned ? TIER_STYLES[tier] : 'from-muted to-muted grayscale opacity-60'
      )}>
        {def.emoji}
        {earned && (
          <span className="absolute -bottom-2 rounded-full border-2 border-card bg-card px-1.5 text-[10px] font-black">
            {['I', 'II', 'III'][tier]}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-extrabold">{def.name}</p>
          {earned && <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{TIER_NAMES[tier]}</span>}
        </div>
        <p className="text-xs text-muted-foreground">{maxed ? 'Maxed out!' : def.desc(nextTarget)}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="duo-shine h-full rounded-full bg-xp transition-[width] duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] font-extrabold text-muted-foreground">{Math.min(value, nextTarget)}/{nextTarget}</span>
        </div>
      </div>
    </div>
  );
};

export const useAchievementRows = () => {
  const state = useGameStore();
  return ACHIEVEMENTS.map(def => ({
    def,
    tier: state.achievements[def.id] ?? -1,
    value: def.value(state),
  }));
};
