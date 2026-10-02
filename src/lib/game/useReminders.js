import { useEffect } from 'react';
import useGameStore from '@/store/useGameStore';
import { dayKey } from '@/lib/game/dates';

// There's no server, so reminders fire while the app is open in a tab/window.
export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export const requestNotificationPermission = async () => {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
};

const showReminder = (streak) => {
  const title = streak > 0 ? `🔥 Your ${streak} day streak is at risk!` : '📚 Time for a quick check-in';
  const body = streak > 0
    ? 'Log one thing in TrackitAll to keep your streak alive.'
    : 'Log one thing today to start a streak.';
  try {
    new Notification(title, { body, icon: `${process.env.PUBLIC_URL}/favicon.svg`, tag: 'streak-reminder' });
  } catch {
    // Some mobile browsers only allow notifications from a service worker
  }
};

const msUntil = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return target - new Date();
};

export const useStreakReminder = () => {
  const enabled = useGameStore(s => s.settings.reminders);
  const time = useGameStore(s => s.settings.reminderTime);

  useEffect(() => {
    if (!enabled || !notificationsSupported()) return undefined;

    const maybeRemind = () => {
      const s = useGameStore.getState();
      const today = dayKey();
      if (Notification.permission !== 'granted') return;
      if (s.streak.lastActive === today || s.lastReminded === today) return;
      showReminder(s.streak.current);
      s.markReminded(today);
    };

    const wait = msUntil(time);
    if (wait <= 0) {
      maybeRemind();
      return undefined;
    }
    const timer = setTimeout(maybeRemind, wait);
    return () => clearTimeout(timer);
  }, [enabled, time]);
};
