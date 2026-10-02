// Game rules: XP per activity, levels, daily goals, quests, achievements and league tiers.

// XP for each kind of activity. `cap` limits how many times per day it pays XP,
// so logging still counts for streaks/quests but can't be farmed.
export const ACTIVITIES = {
  attendance:         { tracker: 'attendance', xp: 10, cap: 6,  label: 'Class marked' },
  study:              { tracker: 'study',      xp: 15, cap: 5,  label: 'Study session' },
  pomodoro:           { tracker: 'study',      xp: 15, cap: 6,  label: 'Focus session' },
  exam:               { tracker: 'study',      xp: 5,  cap: 3,  label: 'Exam added' },
  habit:              { tracker: 'habits',     xp: 10, cap: 10, label: 'Habit done' },
  goal_create:        { tracker: 'goals',      xp: 5,  cap: 3,  label: 'Goal created' },
  goal_progress:      { tracker: 'goals',      xp: 5,  cap: 5,  label: 'Goal progress' },
  goal_complete:      { tracker: 'goals',      xp: 50, cap: 3,  label: 'Goal complete' },
  challenge_create:   { tracker: 'challenges', xp: 5,  cap: 3,  label: 'Challenge created' },
  challenge_progress: { tracker: 'challenges', xp: 5,  cap: 5,  label: 'Challenge progress' },
  challenge_complete: { tracker: 'challenges', xp: 50, cap: 3,  label: 'Challenge complete' },
  mood:               { tracker: 'mood',       xp: 10, cap: 2,  label: 'Mood logged' },
  workout:            { tracker: 'health',     xp: 15, cap: 3,  label: 'Health logged' },
  water:              { tracker: 'water',      xp: 2,  cap: 10, label: 'Glass of water' },
  water_goal:         { tracker: 'water',      xp: 10, cap: 1,  label: 'Hydration goal' },
  weight:             { tracker: 'weight',     xp: 10, cap: 1,  label: 'Weight logged' },
  expense:            { tracker: 'finance',    xp: 5,  cap: 5,  label: 'Transaction logged' },
  recurring:          { tracker: 'recurring',  xp: 5,  cap: 3,  label: 'Bill added' },
  catchup:            { tracker: null,         xp: 5,  cap: 12, label: 'Catch-up entry' },
};

// Levels: reaching level L needs 25·L·(L−1) total XP → 50, 150, 300, 500, …
export const xpForLevel = (level) => 25 * level * (level - 1);

export const levelFromXP = (xp) =>
  Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * Math.max(0, xp)) / 25)) / 2));

export const levelProgress = (xp) => {
  const level = levelFromXP(xp);
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - floor, needed: next - floor, pct: ((xp - floor) / (next - floor)) * 100 };
};

export const DAILY_GOALS = [
  { xp: 20, label: 'Casual', blurb: 'A couple of quick logs', emoji: '🌱' },
  { xp: 30, label: 'Regular', blurb: 'A few logs a day', emoji: '🌿' },
  { xp: 50, label: 'Serious', blurb: 'Track most of your day', emoji: '🌳' },
  { xp: 80, label: 'Intense', blurb: 'Track everything', emoji: '🔥' },
];

export const FREEZE_COST = 200;
export const MAX_FREEZES = 2;
export const DAILY_GOAL_GEMS = 5;

// Quest pool. `types` sums those activity counts; other metrics are special.
const QUEST_POOL = [
  { id: 'distinct3', emoji: '🧭', title: 'Use 3 different trackers', metric: 'distinct', target: 3, gems: 15 },
  { id: 'count5', emoji: '⚡', title: 'Log 5 activities', metric: 'count', target: 5, gems: 15 },
  { id: 'mood1', emoji: '😊', title: 'Log your mood', types: ['mood'], target: 1, gems: 10, tracker: 'mood' },
  { id: 'water6', emoji: '💧', title: 'Drink 6 glasses of water', types: ['water'], target: 6, gems: 15, tracker: 'water' },
  { id: 'habit1', emoji: '✅', title: 'Check off a habit', types: ['habit'], target: 1, gems: 10, tracker: 'habits' },
  { id: 'habit3', emoji: '✅', title: 'Complete 3 habits', types: ['habit'], target: 3, gems: 20, tracker: 'habits' },
  { id: 'study1', emoji: '📚', title: 'Log a study session', types: ['study', 'pomodoro'], target: 1, gems: 10, tracker: 'study' },
  { id: 'focus2', emoji: '⏱️', title: 'Finish 2 focus sessions', types: ['pomodoro'], target: 2, gems: 20, tracker: 'study' },
  { id: 'class2', emoji: '🎓', title: 'Mark 2 classes', types: ['attendance'], target: 2, gems: 10, tracker: 'attendance' },
  { id: 'money2', emoji: '💸', title: 'Log 2 transactions', types: ['expense'], target: 2, gems: 10, tracker: 'finance' },
  { id: 'workout1', emoji: '💪', title: 'Log a workout', types: ['workout'], target: 1, gems: 15, tracker: 'health' },
  { id: 'weight1', emoji: '⚖️', title: 'Log your weight', types: ['weight'], target: 1, gems: 10, tracker: 'weight' },
  { id: 'goal1', emoji: '🎯', title: 'Make progress on a goal', types: ['goal_create', 'goal_progress', 'goal_complete'], target: 1, gems: 10, tracker: 'goals' },
  { id: 'challenge1', emoji: '🏆', title: 'Move a challenge forward', types: ['challenge_create', 'challenge_progress', 'challenge_complete'], target: 1, gems: 10, tracker: 'challenges' },
];

export const pickQuests = (dateKey, dailyGoal, enabledTrackers, rand) => {
  const first = { id: 'xp', emoji: '⚡', title: `Earn ${dailyGoal} XP`, metric: 'xp', target: dailyGoal, gems: 10 };
  const eligible = QUEST_POOL.filter(q => !q.tracker || enabledTrackers.includes(q.tracker));
  const picked = [];
  const pool = [...eligible];
  while (picked.length < 2 && pool.length) {
    const i = Math.floor(rand() * pool.length);
    const [q] = pool.splice(i, 1);
    // Avoid two quests about the same tracker on one day
    if (q.tracker && picked.some(p => p.tracker === q.tracker)) continue;
    picked.push(q);
  }
  return [first, ...picked];
};

export const questProgress = (quest, day) => {
  const counts = day?.counts || {};
  let value = 0;
  if (quest.metric === 'xp') value = day?.xp || 0;
  else if (quest.metric === 'count') value = Object.values(counts).reduce((a, b) => a + b, 0);
  else if (quest.metric === 'distinct') {
    value = new Set(Object.keys(counts).map(t => ACTIVITIES[t]?.tracker).filter(Boolean)).size;
  } else value = (quest.types || []).reduce((sum, t) => sum + (counts[t] || 0), 0);
  return Math.min(value, quest.target);
};

// Tiered achievements. `value` reads from the game state.
const sumTotals = (s, types) => types.reduce((a, t) => a + (s.totals[t] || 0), 0);

export const ACHIEVEMENTS = [
  { id: 'wildfire', emoji: '🔥', name: 'Wildfire', desc: n => `Reach a ${n} day streak`, tiers: [3, 14, 60], value: s => s.streak.longest },
  { id: 'sage', emoji: '🧠', name: 'Sage', desc: n => `Earn ${n} XP`, tiers: [250, 1500, 7500], value: s => s.totalXP },
  { id: 'committed', emoji: '⚡', name: 'Committed', desc: n => `Hit your daily goal ${n} times`, tiers: [3, 21, 100], value: s => s.stats.goalsMet },
  { id: 'quest_master', emoji: '📜', name: 'Quest Master', desc: n => `Complete ${n} quests`, tiers: [5, 40, 150], value: s => s.stats.questsDone },
  { id: 'scholar', emoji: '📚', name: 'Scholar', desc: n => `Log ${n} study sessions`, tiers: [5, 30, 120], value: s => sumTotals(s, ['study', 'pomodoro']) },
  { id: 'present', emoji: '🎓', name: 'Present', desc: n => `Mark ${n} classes`, tiers: [10, 60, 200], value: s => sumTotals(s, ['attendance']) },
  { id: 'habit_hero', emoji: '✅', name: 'Habit Hero', desc: n => `Complete ${n} habits`, tiers: [10, 75, 300], value: s => sumTotals(s, ['habit']) },
  { id: 'goal_getter', emoji: '🎯', name: 'Goal Getter', desc: n => `Finish ${n} goals or challenges`, tiers: [1, 5, 20], value: s => sumTotals(s, ['goal_complete', 'challenge_complete']) },
  { id: 'mindful', emoji: '😊', name: 'Mindful', desc: n => `Log your mood ${n} times`, tiers: [7, 45, 150], value: s => sumTotals(s, ['mood']) },
  { id: 'hydrated', emoji: '💧', name: 'Hydrated', desc: n => `Drink ${n} glasses of water`, tiers: [40, 250, 1000], value: s => sumTotals(s, ['water']) },
  { id: 'athlete', emoji: '💪', name: 'Athlete', desc: n => `Log ${n} workouts`, tiers: [5, 30, 120], value: s => sumTotals(s, ['workout']) },
  { id: 'money_smart', emoji: '💸', name: 'Money Smart', desc: n => `Log ${n} transactions`, tiers: [10, 75, 300], value: s => sumTotals(s, ['expense', 'recurring']) },
  { id: 'champion', emoji: '👑', name: 'Champion', desc: n => `Get promoted ${n} times`, tiers: [1, 3, 6], value: s => s.stats.promotions },
];

export const TIER_NAMES = ['Bronze', 'Silver', 'Gold'];
export const TIER_STYLES = [
  'from-amber-700 to-orange-500',
  'from-slate-400 to-slate-200',
  'from-yellow-500 to-amber-300',
];

// Weekly league tiers
export const LEAGUES = [
  { name: 'Bronze', emoji: '🥉', color: 'from-amber-700 to-orange-600' },
  { name: 'Silver', emoji: '🥈', color: 'from-slate-500 to-slate-300' },
  { name: 'Gold', emoji: '🥇', color: 'from-yellow-500 to-amber-400' },
  { name: 'Sapphire', emoji: '💙', color: 'from-blue-600 to-sky-400' },
  { name: 'Ruby', emoji: '❤️', color: 'from-rose-600 to-red-400' },
  { name: 'Emerald', emoji: '💚', color: 'from-emerald-600 to-green-400' },
  { name: 'Amethyst', emoji: '💜', color: 'from-violet-700 to-fuchsia-400' },
  { name: 'Pearl', emoji: '🤍', color: 'from-pink-200 to-slate-100' },
  { name: 'Obsidian', emoji: '🖤', color: 'from-zinc-800 to-zinc-500' },
  { name: 'Diamond', emoji: '💎', color: 'from-cyan-400 to-indigo-400' },
];

export const LEAGUE_SIZE = 15;
export const PROMOTE_COUNT = 5;
export const DEMOTE_COUNT = 4;
