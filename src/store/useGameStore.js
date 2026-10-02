import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useStore from '@/store/useStore';
import { dayKey, addDays, diffDays, weekStartKey, seededRandom } from '@/lib/game/dates';
import {
  ACTIVITIES, ACHIEVEMENTS, levelFromXP, pickQuests, questProgress,
  FREEZE_COST, MAX_FREEZES, DAILY_GOAL_GEMS, LEAGUES,
} from '@/lib/game/rules';
import { DEFAULT_TRACKERS } from '@/lib/game/trackers';
import { standings, weeklyXP, zoneFor, leagueWindow } from '@/lib/game/league';
import { playSound, setSoundEnabled, vibrate } from '@/lib/game/sound';

const DAYS_KEPT = 120;
let eventSeq = 0;

const initialState = {
  settings: {
    onboarded: false,
    dailyGoal: 30,
    trackers: DEFAULT_TRACKERS,
    sound: true,
    reminders: false,
    reminderTime: '20:00',
  },
  totalXP: 0,
  gems: 0,
  streak: { current: 0, longest: 0, lastActive: null, freezes: 0 },
  days: {},     // { 'YYYY-MM-DD': { xp, counts: { type: n }, goalMet, frozen } }
  totals: {},   // lifetime activity counts by type
  stats: { questsDone: 0, goalsMet: 0, promotions: 0 },
  questsDone: {}, // { 'YYYY-MM-DD': [questId] }
  achievements: {}, // { id: tierIndex reached (0-based) }
  league: { week: null, tier: 0, start: null },
  lastReminded: null,
  events: [],   // reward queue for the UI (not persisted)
};

export const todaysQuests = (state, key = dayKey()) =>
  pickQuests(key, state.settings.dailyGoal, state.settings.trackers, seededRandom(`quests:${key}`));

const achievementTier = (def, state) => {
  const v = def.value(state);
  let tier = -1;
  def.tiers.forEach((t, i) => { if (v >= t) tier = i; });
  return tier;
};

const pruneDays = (days) => {
  const keys = Object.keys(days).sort();
  if (keys.length <= DAYS_KEPT) return days;
  const keep = {};
  keys.slice(-DAYS_KEPT).forEach(k => { keep[k] = days[k]; });
  return keep;
};

const useGameStore = create(
  persist(
    (set, get) => {
      const emit = (list, kind, payload = {}) => list.push({ id: ++eventSeq, kind, ...payload });

      return {
        ...initialState,

        setSettings: (patch) => {
          set(s => ({ settings: { ...s.settings, ...patch } }));
          if ('sound' in patch) setSoundEnabled(patch.sound);
        },

        completeOnboarding: (patch) => {
          // Profiles from before the redesign keep the XP they already earned
          const legacyXP = useStore.getState().userStats?.points || 0;
          set(s => ({
            settings: { ...s.settings, ...patch, onboarded: true },
            totalXP: s.totalXP || legacyXP,
          }));
        },

        toggleTracker: (id) => set(s => {
          const on = s.settings.trackers.includes(id);
          const trackers = on ? s.settings.trackers.filter(t => t !== id) : [...s.settings.trackers, id];
          return { settings: { ...s.settings, trackers } };
        }),

        // Central reward engine: every logged thing in the app goes through here.
        recordActivity: (type, opts = {}) => {
          const rule = ACTIVITIES[type];
          if (!rule) {
            console.warn('Unknown activity type:', type);
            return { xp: 0 };
          }

          const s = get();
          const today = dayKey();
          const events = [];
          const day = { xp: 0, counts: {}, ...(s.days[today] || {}) };
          const countBefore = day.counts[type] || 0;
          const xp = opts.xp ?? (countBefore < rule.cap ? rule.xp : 0);

          const questsBefore = todaysQuests(s, today).map(q => questProgress(q, day) >= q.target);

          const newDay = {
            ...day,
            xp: day.xp + xp,
            counts: { ...day.counts, [type]: countBefore + 1 },
          };
          const totals = { ...s.totals, [type]: (s.totals[type] || 0) + 1 };
          const totalXP = s.totalXP + xp;
          let gems = s.gems;
          const stats = { ...s.stats };

          emit(events, 'xp', { amount: xp, label: rule.label, capped: xp === 0 });
          if (opts.celebrate) emit(events, 'celebrate', opts.celebrate);

          // Streak: the first activity of a day extends it
          const streak = { ...s.streak };
          if (streak.lastActive !== today) {
            const continues = streak.lastActive === addDays(today, -1);
            streak.current = continues ? streak.current + 1 : 1;
            streak.longest = Math.max(streak.longest, streak.current);
            streak.lastActive = today;
            let freezeEarned = false;
            if (streak.current % 7 === 0 && streak.freezes < MAX_FREEZES) {
              streak.freezes += 1;
              freezeEarned = true;
            }
            emit(events, 'streak', { count: streak.current, freezeEarned });
          }

          // Daily goal
          if (!day.goalMet && newDay.xp >= s.settings.dailyGoal) {
            newDay.goalMet = true;
            stats.goalsMet += 1;
            gems += DAILY_GOAL_GEMS;
            emit(events, 'goal', { xp: newDay.xp, goal: s.settings.dailyGoal, gems: DAILY_GOAL_GEMS });
          }

          // Quests
          const doneToday = [...(s.questsDone[today] || [])];
          todaysQuests(s, today).forEach((q, i) => {
            if (!questsBefore[i] && questProgress(q, newDay) >= q.target && !doneToday.includes(q.id)) {
              doneToday.push(q.id);
              stats.questsDone += 1;
              gems += q.gems;
              emit(events, 'quest', { title: q.title, emoji: q.emoji, gems: q.gems });
            }
          });

          // Level up
          const prevLevel = levelFromXP(s.totalXP);
          const level = levelFromXP(totalXP);
          if (level > prevLevel) emit(events, 'level', { level });

          // Achievements (evaluated against the updated state)
          const next = {
            ...s, totalXP, gems, streak, totals, stats,
            days: { ...s.days, [today]: newDay },
          };
          const achievements = { ...s.achievements };
          ACHIEVEMENTS.forEach(def => {
            const tier = achievementTier(def, next);
            if (tier > (achievements[def.id] ?? -1)) {
              achievements[def.id] = tier;
              emit(events, 'achievement', { achievementId: def.id, tier });
            }
          });

          set({
            totalXP, gems, streak, totals, stats, achievements,
            days: pruneDays(next.days),
            questsDone: { [today]: doneToday },
            events: [...s.events, ...events],
          });

          // Keep the legacy profile stats (used by a few widgets) in sync
          useStore.getState().setUserStats({ points: totalXP, level });

          if (xp > 0) { playSound('xp'); vibrate(15); }
          return { xp };
        },

        // Run on app start and when the app regains focus: streak breaks/freezes and league rollover.
        checkDay: () => {
          const s = get();
          const today = dayKey();
          const events = [];
          const streak = { ...s.streak };
          const days = { ...s.days };
          const stats = { ...s.stats };
          let league = { ...s.league };

          if (streak.lastActive && streak.current > 0) {
            const missed = diffDays(streak.lastActive, today) - 1;
            if (missed > 0) {
              if (streak.freezes >= missed) {
                for (let i = 1; i <= missed; i++) {
                  const k = addDays(streak.lastActive, i);
                  days[k] = { xp: 0, counts: {}, ...(days[k] || {}), frozen: true };
                }
                streak.freezes -= missed;
                streak.lastActive = addDays(today, -1);
                emit(events, 'freeze', { used: missed, count: streak.current });
              } else {
                emit(events, 'streak-lost', { lost: streak.current });
                streak.current = 0;
              }
            }
          }

          const week = weekStartKey(today);
          if (league.week && league.week !== week) {
            const final = standings({
              weekKey: league.week,
              tier: league.tier,
              userXP: weeklyXP(days, league.week),
              window: { ...leagueWindow(league.start, league.week), progress: 1 },
            });
            const me = final.find(r => r.isUser);
            const zone = zoneFor(me.rank, league.tier);
            const from = league.tier;
            if (zone === 'promote') { league.tier += 1; stats.promotions += 1; }
            if (zone === 'demote') league.tier -= 1;
            emit(events, 'league', { rank: me.rank, zone, from, to: league.tier });
          }
          // First league starts now; later ones start on Monday
          if (league.week !== week) league = { ...league, week, start: league.week ? null : new Date().toISOString() };

          set({ streak, days, stats, league, events: [...s.events, ...events] });
        },

        buyFreeze: () => {
          const s = get();
          if (s.gems < FREEZE_COST || s.streak.freezes >= MAX_FREEZES) return false;
          set({ gems: s.gems - FREEZE_COST, streak: { ...s.streak, freezes: s.streak.freezes + 1 } });
          playSound('freeze');
          return true;
        },

        shiftEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),

        markReminded: (key) => set({ lastReminded: key }),
      };
    },
    {
      name: 'trackitall-game',
      partialize: ({ events, ...rest }) => rest,
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        settings: { ...current.settings, ...(persisted?.settings || {}) },
        stats: { ...current.stats, ...(persisted?.stats || {}) },
        streak: { ...current.streak, ...(persisted?.streak || {}) },
        league: { ...current.league, ...(persisted?.league || {}) },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) setSoundEnabled(state.settings.sound);
      },
    }
  )
);

// Selectors
const EMPTY_DAY = { xp: 0, counts: {} };
export const useToday = () => useGameStore(s => s.days[dayKey()] || EMPTY_DAY);
export const leagueInfo = (tier) => LEAGUES[Math.max(0, Math.min(LEAGUES.length - 1, tier))];

export default useGameStore;
