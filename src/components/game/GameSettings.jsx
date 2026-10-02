import React from 'react';
import { toast } from 'sonner';
import { Bell, Volume2 } from 'lucide-react';
import useGameStore from '@/store/useGameStore';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { DAILY_GOALS } from '@/lib/game/rules';
import { TRACKERS } from '@/lib/game/trackers';
import { requestNotificationPermission, notificationsSupported } from '@/lib/game/useReminders';
import { playSound } from '@/lib/game/sound';
import { cn } from '@/lib/utils';

const Row = ({ icon: Icon, title, desc, children, color }) => (
  <div className="flex items-center gap-4 py-3">
    <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', color)}><Icon className="h-5 w-5" /></div>
    <div className="min-w-0 flex-1">
      <p className="font-extrabold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    {children}
  </div>
);

export const GameSettings = () => {
  const settings = useGameStore(s => s.settings);
  const setSettings = useGameStore(s => s.setSettings);
  const toggleTracker = useGameStore(s => s.toggleTracker);

  const toggleReminders = async (on) => {
    if (!on) return setSettings({ reminders: false });
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      setSettings({ reminders: true });
      toast.success(`We'll nudge you at ${settings.reminderTime} if you haven't logged anything`);
    } else {
      toast.error(permission === 'unsupported' ? "This browser doesn't support notifications" : 'Notifications are blocked for this site');
    }
  };

  return (
    <>
      <section className="duo-card p-6">
        <h2 className="text-xl font-black">Daily goal</h2>
        <p className="mb-4 text-sm text-muted-foreground">How much XP you aim for each day.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DAILY_GOALS.map(g => (
            <button
              key={g.xp}
              onClick={() => { playSound('tap'); setSettings({ dailyGoal: g.xp }); }}
              className={cn('duo-tile flex flex-col items-center gap-1 p-3', settings.dailyGoal === g.xp && 'border-primary/70 bg-primary/10')}
              aria-pressed={settings.dailyGoal === g.xp}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="font-black">{g.label}</span>
              <span className="text-xs font-bold text-muted-foreground">{g.xp} XP/day</span>
            </button>
          ))}
        </div>
      </section>

      <section className="duo-card divide-y-2 divide-border px-6 py-3">
        <Row icon={Volume2} title="Sound effects" desc="Dings, cheers and level-up fanfares" color="bg-primary/15 text-primary">
          <Switch
            checked={settings.sound}
            onCheckedChange={(on) => { setSettings({ sound: on }); if (on) playSound('xp'); }}
            aria-label="Sound effects"
          />
        </Row>
        <Row
          icon={Bell}
          title="Streak reminder"
          desc={notificationsSupported() ? 'A nudge if you haven\'t logged by this time (while the app is open)' : "Notifications aren't supported in this browser"}
          color="bg-streak/15 text-streak"
        >
          <div className="flex items-center gap-3">
            {settings.reminders && (
              <Input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => setSettings({ reminderTime: e.target.value || '20:00' })}
                className="h-10 w-28"
                aria-label="Reminder time"
              />
            )}
            <Switch checked={settings.reminders} onCheckedChange={toggleReminders} aria-label="Streak reminder" disabled={!notificationsSupported()} />
          </div>
        </Row>
      </section>

      <section className="duo-card p-6">
        <h2 className="text-xl font-black">Trackers on Today</h2>
        <p className="mb-4 text-sm text-muted-foreground">Tap to show or hide them on your Today screen.</p>
        <div className="flex flex-wrap gap-2">
          {TRACKERS.map(t => {
            const on = settings.trackers.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => { playSound('tap'); toggleTracker(t.id); }}
                className={cn(
                  'flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-extrabold transition-colors',
                  on ? 'border-primary/60 bg-primary/15 text-foreground' : 'border-border text-muted-foreground hover:bg-muted'
                )}
                aria-pressed={on}
              >
                <span className={cn(!on && 'grayscale')}>{t.emoji}</span>{t.label}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default GameSettings;
