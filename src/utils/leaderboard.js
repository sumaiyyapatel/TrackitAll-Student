import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

/**
 * Fetch top leaderboard entries (public, index-safe)
 * query: orderBy('points','desc') + limit
 */
export const fetchTopLeaderboard = async (db, top = 10) => {
  const q = query(collection(db, 'leaderboard'), orderBy('points', 'desc'), limit(top));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export default fetchTopLeaderboard;
