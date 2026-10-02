// Weekly practice league. Data is local-only, so rivals are simulated:
// each week + tier seeds a stable set of rivals whose XP grows through the week.
import { seededRandom, weekDays, keyToDate } from './dates';
import { LEAGUE_SIZE, PROMOTE_COUNT, DEMOTE_COUNT, LEAGUES } from './rules';

const NAMES = [
  'Aarav', 'Mia', 'Leo', 'Zara', 'Kenji', 'Sofia', 'Omar', 'Ivy', 'Noah', 'Priya',
  'Lucas', 'Amara', 'Ethan', 'Chloe', 'Ravi', 'Hana', 'Mateo', 'Nia', 'Felix', 'Yuki',
  'Sana', 'Diego', 'Elena', 'Kai', 'Lina', 'Arjun', 'Maya', 'Theo', 'Aisha', 'Jonas',
];
const AVATARS = ['🦊', '🐼', '🐨', '🐯', '🐸', '🐙', '🦄', '🐧', '🐰', '🦁', '🐻', '🐵', '🐳', '🦉', '🐞', '🐢'];
const COLORS = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'];

export const makeRivals = (weekKey, tier) => {
  const rand = seededRandom(`${weekKey}:${tier}`);
  const names = [...NAMES];
  const base = 18 + tier * 9; // typical daily XP grows with the league
  return Array.from({ length: LEAGUE_SIZE - 1 }, (_, i) => {
    const name = names.splice(Math.floor(rand() * names.length), 1)[0];
    const inactive = rand() < 0.15;
    return {
      id: `rival-${i}`,
      name,
      avatar: AVATARS[Math.floor(rand() * AVATARS.length)],
      color: COLORS[Math.floor(rand() * COLORS.length)],
      pace: inactive ? 0 : base * (0.35 + rand() * 1.5),
      curve: 0.75 + rand() * 0.5, // <1 front-loads the week, >1 back-loads it
    };
  });
};

// Rivals earn their weekly pace over the league window
const rivalXP = (rival, { progress, days }) =>
  Math.round(rival.pace * days * Math.pow(progress, rival.curve));

export const weeklyXP = (days, weekKey) =>
  weekDays(weekKey).reduce((sum, k) => sum + (days[k]?.xp || 0), 0);

// The user's league window for a week. A league joined mid-week starts at the join time,
// so rivals don't get a head start on day one.
export const leagueWindow = (startISO, weekKey, now = new Date()) => {
  const weekStart = keyToDate(weekKey);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  const start = startISO ? new Date(Math.max(new Date(startISO), weekStart)) : weekStart;
  const span = Math.max(end - start, 3600000);
  return {
    progress: Math.min(1, Math.max(0, (now - start) / span)),
    days: span / 86400000,
  };
};

// Full standings, sorted by XP
export const standings = ({ weekKey, tier, userXP, userName, window }) => {
  const rows = makeRivals(weekKey, tier).map(r => ({ ...r, xp: rivalXP(r, window), isUser: false }));
  rows.push({ id: 'you', name: userName || 'You', avatar: null, color: 'bg-primary', xp: userXP, isUser: true });
  // Ties go to the user, it's their league after all
  rows.sort((a, b) => b.xp - a.xp || (b.isUser ? 1 : 0) - (a.isUser ? 1 : 0));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
};

export const zoneFor = (rank, tier) => {
  if (rank <= PROMOTE_COUNT && tier < LEAGUES.length - 1) return 'promote';
  if (rank > LEAGUE_SIZE - DEMOTE_COUNT && tier > 0) return 'demote';
  return 'stay';
};
