import React from 'react';
import { Link } from 'react-router-dom';
import { Snowflake } from 'lucide-react';
import { toast } from 'sonner';
import useGameStore, { useToday, leagueInfo } from '@/store/useGameStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { StreakWeek, GoalRing } from '@/components/game/widgets';
import { dayKey } from '@/lib/game/dates';
import { FREEZE_COST, MAX_FREEZES } from '@/lib/game/rules';
import { cn } from '@/lib/utils';

export const StreakPanel = () => {
  const streak = useGameStore(s => s.streak);
  const activeToday = streak.lastActive === dayKey();
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={cn('text-4xl', !activeToday && 'grayscale')}>🔥</span>
        <div>
          <p className="text-xl font-black">{streak.current} day streak</p>
          <p className="text-xs text-muted-foreground">
            {activeToday ? 'Extended today — nice!' : streak.current > 0 ? 'Log something today to keep it' : 'Log anything to start one'}
          </p>
        </div>
      </div>
      <StreakWeek className="mt-4" />
      <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs font-bold">
        <span className="flex items-center gap-1.5 text-gem"><Snowflake className="h-4 w-4" /> {streak.freezes}/{MAX_FREEZES} freezes equipped</span>
        <span className="text-muted-foreground">Best: {streak.longest}</span>
      </div>
    </div>
  );
};

export const GemShop = () => {
  const gems = useGameStore(s => s.gems);
  const freezes = useGameStore(s => s.streak.freezes);
  const buyFreeze = useGameStore(s => s.buyFreeze);
  const full = freezes >= MAX_FREEZES;

  const buy = () => {
    if (buyFreeze()) toast.success('Streak freeze equipped ❄️');
  };

  return (
    <div>
      <p className="text-xl font-black">💎 {gems} gems</p>
      <p className="text-xs text-muted-foreground">Earn gems from quests and daily goals.</p>
      <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-border p-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gem/15 text-gem"><Snowflake className="h-6 w-6" /></div>
        <div className="flex-1">
          <p className="text-sm font-extrabold">Streak freeze</p>
          <p className="text-xs text-muted-foreground">{full ? 'You have the max equipped' : 'Protects your streak for one missed day'}</p>
        </div>
        <Button size="sm" variant={gems >= FREEZE_COST && !full ? 'default' : 'secondary'} disabled={gems < FREEZE_COST || full} onClick={buy}>
          {FREEZE_COST} 💎
        </Button>
      </div>
    </div>
  );
};

const Chip = ({ children, label, className }) => (
  <PopoverTrigger asChild>
    <button className={cn('stat-chip', className)} aria-label={label}>{children}</button>
  </PopoverTrigger>
);

export const StatBar = ({ className = '' }) => {
  const streak = useGameStore(s => s.streak);
  const gems = useGameStore(s => s.gems);
  const goal = useGameStore(s => s.settings.dailyGoal);
  const tier = useGameStore(s => s.league.tier);
  const today = useToday();
  const activeToday = streak.lastActive === dayKey();
  const league = leagueInfo(tier);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover>
        <Chip label={`${streak.current} day streak`} className={activeToday ? 'text-streak' : 'text-muted-foreground'}>
          <span className={cn('text-lg leading-none', !activeToday && 'grayscale')}>🔥</span>{streak.current}
        </Chip>
        <PopoverContent align="end"><StreakPanel /></PopoverContent>
      </Popover>

      <Popover>
        <Chip label={`${gems} gems`} className="text-gem">
          <span className="text-lg leading-none">💎</span>{gems}
        </Chip>
        <PopoverContent align="end"><GemShop /></PopoverContent>
      </Popover>

      <Popover>
        <Chip label="Daily goal" className={today.xp >= goal ? 'text-xp' : 'text-primary'}>
          <span className="text-lg leading-none">⚡</span>{today.xp}<span className="hidden text-muted-foreground sm:inline">/{goal}</span>
        </Chip>
        <PopoverContent align="end" className="flex items-center gap-4">
          <GoalRing size={96} stroke={10} />
          <div>
            <p className="font-black">Daily goal</p>
            <p className="text-xs text-muted-foreground">{today.xp >= goal ? 'Done for today — anything more is a bonus!' : `${goal - today.xp} XP to go`}</p>
            <Link to="/settings" className="mt-2 inline-block text-xs font-extrabold text-primary">Change goal</Link>
          </div>
        </PopoverContent>
      </Popover>

      <Link to="/league" className="stat-chip" aria-label={`${league.name} league`}>
        <span className="text-lg leading-none">{league.emoji}</span>
      </Link>
    </div>
  );
};

export default StatBar;
