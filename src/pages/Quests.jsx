import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/game/PageHeader';
import { MascotSays } from '@/components/game/Mascot';
import { QuestList, AchievementBadge, useAchievementRows } from '@/components/game/widgets';
import { GemShop } from '@/components/game/StatBar';
import useGameStore from '@/store/useGameStore';
import { dayKey, addDays, keyToDate } from '@/lib/game/dates';

const useCountdown = () => {
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const ms = keyToDate(addDays(dayKey(), 1)) - new Date();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setLeft(`${h}h ${m}m`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);
  return left;
};

export default function Quests() {
  const rows = useAchievementRows();
  const questsDone = useGameStore(s => s.stats.questsDone);
  const left = useCountdown();
  const earned = rows.filter(r => r.tier >= 0).length;

  return (
    <Layout hideRail>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Quests" subtitle="Fresh quests every day. Complete them for gems." emoji="📜" colorClass="bg-amber-500" />

        <section className="duo-card overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-fuchsia-500 px-5 py-4 text-white">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/80">Daily quests</p>
              <p className="text-lg font-black">Resets in {left}</p>
            </div>
            <motion.span className="text-4xl" animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>🎁</motion.span>
          </div>
          <div className="p-5"><QuestList /></div>
        </section>

        <section className="duo-card p-5">
          <GemShop />
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-black">Achievements</h2>
            <span className="text-xs font-extrabold text-muted-foreground">{earned}/{rows.length} unlocked · {questsDone} quests done</span>
          </div>
          {earned === 0 && (
            <MascotSays mood="think" size={72} className="mb-4">Log your first few things and badges will start popping up here!</MascotSays>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(r => <AchievementBadge key={r.def.id} {...r} />)}
          </div>
        </section>
      </div>
    </Layout>
  );
}
