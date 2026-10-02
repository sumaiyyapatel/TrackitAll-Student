import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pin, PinOff } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { PageHeader } from '@/components/game/PageHeader';
import useGameStore, { useToday } from '@/store/useGameStore';
import { TRACKERS, TRACKER_GROUPS, TOOLS } from '@/lib/game/trackers';
import { ACTIVITIES } from '@/lib/game/rules';
import { playSound } from '@/lib/game/sound';
import { cn } from '@/lib/utils';

const countFor = (id, counts) =>
  Object.entries(counts || {}).reduce((s, [type, n]) => s + (ACTIVITIES[type]?.tracker === id ? n : 0), 0);

const Tile = ({ item, index, pinned, onPin, count }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.03 }}
    className="relative"
  >
    <Link to={item.path} className="duo-tile group flex items-center gap-4 p-4 pr-14">
      <span className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] transition-transform group-hover:-rotate-6 group-hover:scale-110',
        item.color.bg
      )}>
        {item.emoji}
      </span>
      <div className="min-w-0">
        <p className="font-extrabold">{item.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {count > 0 ? <span className={item.color.text}>✓ {count} logged today</span> : item.blurb}
        </p>
      </div>
    </Link>
    {onPin && (
      <button
        onClick={onPin}
        className={cn(
          'absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl transition-colors',
          pinned ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'
        )}
        aria-label={pinned ? `Remove ${item.label} from Today` : `Add ${item.label} to Today`}
        aria-pressed={pinned}
        title={pinned ? 'Shown on Today' : 'Show on Today'}
      >
        {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
      </button>
    )}
  </motion.div>
);

export default function Track() {
  const enabled = useGameStore(s => s.settings.trackers);
  const toggleTracker = useGameStore(s => s.toggleTracker);
  const today = useToday();
  let i = 0;

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-8">
        <PageHeader title="Track" subtitle="Everything you can log. Pin the ones you want on Today." emoji="🧭" colorClass="bg-primary" />

        {TRACKER_GROUPS.map(group => (
          <section key={group}>
            <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {TRACKERS.filter(t => t.group === group).map(t => (
                <Tile
                  key={t.id}
                  item={t}
                  index={i++}
                  count={countFor(t.id, today.counts)}
                  pinned={enabled.includes(t.id)}
                  onPin={() => { playSound('tap'); toggleTracker(t.id); }}
                />
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">More</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map(t => <Tile key={t.id} item={t} index={i++} count={0} />)}
          </div>
        </section>
      </div>
    </Layout>
  );
}
