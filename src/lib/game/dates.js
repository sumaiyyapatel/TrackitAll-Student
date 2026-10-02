// Local-calendar date keys (YYYY-MM-DD). Streaks and goals follow the user's own midnight.

const pad = (n) => String(n).padStart(2, '0');

export const dayKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const keyToDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (key, n) => {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};

// Whole days from a to b (b - a)
export const diffDays = (a, b) =>
  Math.round((keyToDate(b) - keyToDate(a)) / 86400000);

// Weeks start on Monday
export const weekStartKey = (key = dayKey()) => {
  const d = keyToDate(key);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return dayKey(d);
};

export const weekDays = (key = dayKey()) => {
  const start = weekStartKey(key);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

// Fraction of the current week that has elapsed (0..1)
export const weekProgress = (now = new Date()) => {
  const start = keyToDate(weekStartKey(dayKey(now)));
  return Math.min(1, Math.max(0, (now - start) / (7 * 86400000)));
};

export const msUntilWeekEnd = (now = new Date()) => {
  const start = keyToDate(weekStartKey(dayKey(now)));
  start.setDate(start.getDate() + 7);
  return start - now;
};

// Small deterministic PRNG so quests and league rivals are stable for a given day/week
export const seededRandom = (seedText) => {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
};
