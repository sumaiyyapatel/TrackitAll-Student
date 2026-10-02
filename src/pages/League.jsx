import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronsUp, ChevronsDown, Info } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Mascot } from '@/components/game/Mascot';
import useStore from '@/store/useStore';
import useGameStore, { leagueInfo } from '@/store/useGameStore';
import { standings, weeklyXP, zoneFor, leagueWindow } from '@/lib/game/league';
import { weekStartKey, msUntilWeekEnd } from '@/lib/game/dates';
import { LEAGUES, PROMOTE_COUNT, LEAGUE_SIZE, DEMOTE_COUNT } from '@/lib/game/rules';
import { cn } from '@/lib/utils';

const useTimeLeft = () => {
  const fmt = () => {
    const ms = msUntilWeekEnd();
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };
  const [left, setLeft] = useState(fmt);
  useEffect(() => {
    const t = setInterval(() => setLeft(fmt()), 60000);
    return () => clearInterval(t);
  }, []);
  return left;
};

const ZoneDivider = ({ kind }) => (
  <li className={cn(
    'flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest',
    kind === 'promote' ? 'text-success' : 'text-danger'
  )}>
    {kind === 'promote' ? <ChevronsUp className="h-4 w-4" /> : <ChevronsDown className="h-4 w-4" />}
    {kind === 'promote' ? 'Promotion zone' : 'Demotion zone'}
    <span className={cn('h-0.5 flex-1 rounded-full', kind === 'promote' ? 'bg-success/40' : 'bg-danger/40')} />
  </li>
);

export default function League() {
  const user = useStore(s => s.user);
  const tier = useGameStore(s => s.league.tier);
  const start = useGameStore(s => s.league.start);
  const days = useGameStore(s => s.days);
  const left = useTimeLeft();
  const week = weekStartKey();
  const league = leagueInfo(tier);
  const myXP = weeklyXP(days, week);
  const rows = standings({ weekKey: week, tier, userXP: myXP, userName: user?.displayName?.split(' ')[0], window: leagueWindow(start, week) });
  const me = rows.find(r => r.isUser);
  const zone = zoneFor(me.rank, tier);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* League ladder */}
        <section className="flex flex-col items-center text-center">
          <div className="flex items-end gap-2 sm:gap-3">
            {LEAGUES.map((l, i) => (
              <motion.div
                key={l.name}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'flex items-center justify-center rounded-2xl bg-gradient-to-br shadow-[inset_0_-4px_0_rgba(0,0,0,0.25)]',
                  i === tier ? 'h-16 w-16 text-4xl ring-4 ring-primary/40' : 'h-9 w-9 text-lg',
                  i > tier ? 'from-muted to-muted opacity-50 grayscale' : l.color,
                  i !== tier && 'hidden sm:flex'
                )}
                title={l.name}
              >
                {i <= tier ? l.emoji : '🔒'}
              </motion.div>
            ))}
          </div>
          <h1 className="mt-4 text-3xl font-black">{league.name} League</h1>
          <p className="text-sm text-muted-foreground">
            Top {PROMOTE_COUNT} move up · Week ends in <span className="font-extrabold text-xp">{left}</span>
          </p>
        </section>

        {/* Status */}
        <section className="duo-card flex items-center gap-4 p-4">
          <Mascot mood={zone === 'promote' ? 'cheer' : zone === 'demote' ? 'sad' : 'happy'} size={64} />
          <div className="flex-1">
            <p className="font-black">You're #{me.rank} with {myXP} XP this week</p>
            <p className="text-xs text-muted-foreground">
              {zone === 'promote'
                ? tier < LEAGUES.length - 1 ? `Stay in the top ${PROMOTE_COUNT} to reach ${LEAGUES[tier + 1].name}!` : 'Top of the top!'
                : zone === 'demote' ? 'Earn some XP to climb out of the demotion zone.' : `Earn more XP to reach the top ${PROMOTE_COUNT}.`}
            </p>
          </div>
        </section>

        {/* Standings */}
        <section className="duo-card overflow-hidden">
          <ol>
            {rows.map((r) => (
              <React.Fragment key={r.id}>
                <motion.li
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: r.rank * 0.025 }}
                  className={cn(
                    'flex items-center gap-3 border-b-2 border-border/60 px-4 py-3 last:border-b-0',
                    r.isUser && 'bg-primary/10'
                  )}
                >
                  <span className={cn(
                    'w-7 text-center font-black',
                    r.rank === 1 ? 'text-xp' : r.rank === 2 ? 'text-slate-300' : r.rank === 3 ? 'text-amber-600' : 'text-muted-foreground'
                  )}>
                    {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
                  </span>
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-white', r.color)}>
                    {r.avatar || (user?.displayName?.[0]?.toUpperCase() ?? '🐣')}
                  </span>
                  <span className={cn('flex-1 truncate font-extrabold', r.isUser && 'text-primary')}>
                    {r.name}{r.isUser && ' (you)'}
                  </span>
                  <span className="font-black text-muted-foreground">{r.xp} XP</span>
                </motion.li>
                {r.rank === PROMOTE_COUNT && tier < LEAGUES.length - 1 && <ZoneDivider kind="promote" />}
                {r.rank === LEAGUE_SIZE - DEMOTE_COUNT && tier > 0 && <ZoneDivider kind="demote" />}
              </React.Fragment>
            ))}
          </ol>
        </section>

        <p className="flex items-start gap-2 px-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          This is a practice league: your data stays on this device, so the other players are friendly simulated rivals who earn XP through the week.
        </p>
      </div>
    </Layout>
  );
}
