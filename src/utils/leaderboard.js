// utils/leaderboard.js
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';

export default async function fetchTopLeaderboard(db, top = 10) {
  const q = query(
    collection(db, 'users'),
    orderBy('points', 'desc'),
    limit(top)
  );

  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}
