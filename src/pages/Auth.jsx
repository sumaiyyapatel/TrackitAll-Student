import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { db, doc, setDoc, getDoc } from '@/lib/localDb';
import useStore from '@/store/useStore';
import useGameStore from '@/store/useGameStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { MascotSays, Mascot } from '@/components/game/Mascot';
import { TRACKERS, TRACKER_GROUPS } from '@/lib/game/trackers';
import { DAILY_GOALS } from '@/lib/game/rules';
import { requestNotificationPermission, notificationsSupported } from '@/lib/game/useReminders';
import { playSound } from '@/lib/game/sound';
import { cn } from '@/lib/utils';

// Data lives in this browser only, so there is a single local profile
const LOCAL_UID = 'local-user';

const STEPS = ['welcome', 'name', 'trackers', 'goal', 'reminders'];

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { type: 'spring', stiffness: 400, damping: 34 },
};

// Create or refresh the local profile and sign in
const startSession = async (displayName, setUser, setUserStats) => {
  const userRef = doc(db, 'users', LOCAL_UID);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    await setDoc(userRef, {
      uid: LOCAL_UID,
      displayName,
      createdAt: new Date().toISOString(),
      points: 0,
      level: 1,
      badges: [],
      streaks: { attendance: 0, mood: 0, health: 0 },
    });
  } else {
    await setDoc(userRef, { displayName }, { merge: true });
    const data = userDoc.data();
    setUserStats({ points: data.points || 0, level: data.level || 1 });
  }
  setUser({ uid: LOCAL_UID, displayName, email: null, photoURL: null });
};

const WelcomeBack = () => {
  const { setUser, setUserStats } = useStore();
  const [name, setName] = useState('');

  React.useEffect(() => {
    getDoc(doc(db, 'users', LOCAL_UID)).then(d => { if (d.exists()) setName(d.data().displayName || ''); });
  }, []);

  const go = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await startSession(name.trim(), setUser, setUserStats);
    toast.success(`Welcome back, ${name.trim()}!`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.form {...slide} onSubmit={go} className="flex w-full max-w-sm flex-col items-center text-center">
        <Mascot mood="happy" size={130} />
        <h1 className="mt-4 text-3xl font-black">Welcome back!</h1>
        <p className="mt-1 text-muted-foreground">Your streak and data are right where you left them.</p>
        <Input className="mt-6 text-center" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" aria-label="Your name" required />
        <Button type="submit" size="lg" className="mt-4 w-full">Continue</Button>
      </motion.form>
    </div>
  );
};

export default function Onboarding() {
  const { user, setUser, setUserStats } = useStore();
  const settings = useGameStore(s => s.settings);
  const completeOnboarding = useGameStore(s => s.completeOnboarding);

  // Signed in but never onboarded (older profiles) → skip the name step
  const [step, setStep] = useState(user ? 2 : 0);
  const [name, setName] = useState(user?.displayName || '');
  const [trackers, setTrackers] = useState(settings.trackers);
  const [goal, setGoal] = useState(settings.dailyGoal);
  const [saving, setSaving] = useState(false);

  if (settings.onboarded && !user) return <WelcomeBack />;

  const next = () => { playSound('tap'); setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep(s => Math.max(s - 1, user ? 2 : 0));

  const finish = async (reminders) => {
    setSaving(true);
    try {
      let reminderOn = false;
      if (reminders) {
        const permission = await requestNotificationPermission();
        reminderOn = permission === 'granted';
        if (!reminderOn) toast.message('Notifications are blocked — you can turn reminders on later in Settings.');
      }
      if (!user) await startSession(name.trim(), setUser, setUserStats);
      completeOnboarding({ trackers, dailyGoal: goal, reminders: reminderOn });
      playSound('success');
      toast.success(`You're all set${name ? `, ${name.trim()}` : ''}! 🎉`);
    } catch (error) {
      console.error('Onboarding failed:', error);
      toast.error('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const toggle = (id) => setTrackers(t => (t.includes(id) ? t.filter(x => x !== id) : [...t, id]));
  const current = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress header */}
      {step > 0 && (
        <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-6 pt-6">
          <button onClick={back} className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label="Back" disabled={step <= (user ? 2 : 0)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Progress value={progress} className="flex-1" />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={current} {...slide} className="flex flex-1 flex-col">
            {current === 'welcome' && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <Mascot mood="cheer" size={170} />
                <h1 className="mt-6 text-4xl font-black text-primary">trackitall</h1>
                <p className="mt-2 max-w-sm text-lg text-muted-foreground">
                  The fun way to keep up with classes, habits, health and money — one tiny log at a time.
                </p>
                <Button size="lg" className="mt-10 w-full max-w-xs" onClick={next}>Get started</Button>
                <p className="mt-4 text-xs text-muted-foreground">Everything stays private on this device.</p>
              </div>
            )}

            {current === 'name' && (
              <form className="flex flex-1 flex-col" onSubmit={(e) => { e.preventDefault(); if (name.trim()) next(); }}>
                <MascotSays mood="happy">Hi, I'm Pip! What should I call you?</MascotSays>
                <Input
                  autoFocus
                  className="mt-8 h-14 text-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Your name"
                  data-testid="name-input"
                />
                <Button type="submit" size="lg" className="mt-auto w-full sm:mt-8" disabled={!name.trim()} data-testid="submit-button">Continue</Button>
              </form>
            )}

            {current === 'trackers' && (
              <div className="flex flex-1 flex-col">
                <MascotSays mood="think">Nice to meet you{name ? `, ${name.trim().split(' ')[0]}` : ''}! What do you want to keep track of?</MascotSays>
                <p className="mt-6 text-xs font-bold text-muted-foreground">Pick a few — you can change these any time.</p>
                <div className="mt-3 space-y-5">
                  {TRACKER_GROUPS.map(group => (
                    <div key={group}>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{group}</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {TRACKERS.filter(t => t.group === group).map(t => {
                          const on = trackers.includes(t.id);
                          return (
                            <motion.button
                              key={t.id}
                              type="button"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { playSound('tap'); toggle(t.id); }}
                              className={cn('duo-tile relative flex items-center gap-3 p-3 text-left', on && 'border-primary/70 bg-primary/10')}
                              aria-pressed={on}
                            >
                              <span className="text-2xl">{t.emoji}</span>
                              <span className="text-sm font-extrabold">{t.label}</span>
                              {on && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                                  <Check className="h-3 w-3" />
                                </motion.span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <Button size="lg" className="mt-8 w-full" onClick={next} disabled={trackers.length === 0}>
                  Continue
                </Button>
              </div>
            )}

            {current === 'goal' && (
              <div className="flex flex-1 flex-col">
                <MascotSays mood="idle">Pick a daily goal. Hit it every day to build your streak 🔥</MascotSays>
                <div className="mt-8 space-y-3">
                  {DAILY_GOALS.map(g => (
                    <motion.button
                      key={g.xp}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { playSound('tap'); setGoal(g.xp); }}
                      className={cn('duo-tile flex w-full items-center gap-4 p-4 text-left', goal === g.xp && 'border-primary/70 bg-primary/10')}
                      aria-pressed={goal === g.xp}
                    >
                      <span className="text-3xl">{g.emoji}</span>
                      <div className="flex-1">
                        <p className="font-black">{g.label}</p>
                        <p className="text-xs text-muted-foreground">{g.blurb}</p>
                      </div>
                      <span className={cn('font-black', goal === g.xp ? 'text-primary' : 'text-muted-foreground')}>{g.xp} XP / day</span>
                    </motion.button>
                  ))}
                </div>
                <Button size="lg" className="mt-8 w-full" onClick={next}>Continue</Button>
              </div>
            )}

            {current === 'reminders' && (
              <div className="flex flex-1 flex-col">
                <MascotSays mood="happy">Want me to nudge you in the evening if you haven't logged anything?</MascotSays>
                <div className="duo-card mt-8 flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-streak/15 text-streak"><Bell className="h-6 w-6" /></div>
                  <div>
                    <p className="font-black">Streak reminder at 8:00 PM</p>
                    <p className="text-xs text-muted-foreground">
                      {notificationsSupported() ? 'Works while TrackitAll is open in a tab. Change the time in Settings.' : "This browser doesn't support notifications."}
                    </p>
                  </div>
                </div>
                <div className="mt-auto space-y-3 pt-8">
                  {notificationsSupported() && (
                    <Button size="lg" className="w-full" onClick={() => finish(true)} disabled={saving}>Remind me</Button>
                  )}
                  <Button size="lg" variant="outline" className="w-full" onClick={() => finish(false)} disabled={saving}>Not now</Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
