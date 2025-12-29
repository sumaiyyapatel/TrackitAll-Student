import React, { useEffect, useState } from 'react';
import fetchTopLeaderboard from '../utils/leaderboard';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import useStore from '@/store/useStore';

const Leaderboard = ({ top = 10, friendsOnly = false }) => {
  const { user } = useStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFriendsLeaderboard = async () => {
    if (!user) return;
    
    try {
      // Get user's friends
      const friendsQ1 = query(collection(db, 'friends'), where('user1', '==', user.uid), where('status', '==', 'accepted'));
      const friendsQ2 = query(collection(db, 'friends'), where('user2', '==', user.uid), where('status', '==', 'accepted'));
      
      const [friendsSnap1, friendsSnap2] = await Promise.all([getDocs(friendsQ1), getDocs(friendsQ2)]);
      
      const friendIds = new Set();
      friendsSnap1.docs.forEach(d => {
        const data = d.data();
        if (data.user2 !== user.uid) friendIds.add(data.user2);
      });
      friendsSnap2.docs.forEach(d => {
        const data = d.data();
        if (data.user1 !== user.uid) friendIds.add(data.user1);
      });
      
      // Include current user
      friendIds.add(user.uid);
      
      // Get friend user data
      const friendDataPromises = Array.from(friendIds).map(async (friendId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', friendId));
          if (userDoc.exists()) {
            return { id: friendId, ...userDoc.data() };
          }
          return null;
        } catch (error) {
          console.warn('Could not load friend data:', friendId);
          return null;
        }
      });
      
      const friendData = await Promise.all(friendDataPromises);
      const validFriends = friendData.filter(Boolean);
      
      // Sort by points and limit
      const sorted = validFriends
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, top);
      
      setItems(sorted);
    } catch (err) {
      console.error('Failed to load friends leaderboard', err);
      setError('Could not load friends leaderboard. Please try again later.');
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (friendsOnly) {
        await loadFriendsLeaderboard();
      } else {
        const data = await fetchTopLeaderboard(db, top);
        setItems(data);
      }
    } catch (err) {
      // Friendly error message for permission or network issues
      console.error('Failed to load leaderboard', err);
      if (err && err.message && /permission|auth|denied/i.test(err.message)) {
        setError('Leaderboard is not available. It may be restricted.');
      } else {
        setError('Could not load leaderboard. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // add a small polling interval for freshness (optional)
    const id = setInterval(() => load(), 1000 * 60 * 5); // refresh every 5 minutes
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top, friendsOnly, user]);

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {friendsOnly ? 'Friends Leaderboard' : 'Leaderboard'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {friendsOnly ? `Top ${Math.min(items.length, top)} friends` : `Top ${top} users`}
          </p>
        </div>
        <div className="text-sm">🔥</div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">📊 Loading leaderboard...</div>
      ) : error ? (
        <div className="p-3 bg-amber-500/10 rounded border border-amber-500/30">
          <div className="font-medium text-amber-400">Leaderboard unavailable</div>
          <div className="text-sm mt-1 text-amber-300">{error}</div>
          <div className="mt-2">
            <button onClick={load} className="px-3 py-1 bg-violet-600 text-white rounded text-sm hover:bg-violet-500 transition-colors">Try again</button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          {friendsOnly ? '🏆 No friends yet! Add friends to see the leaderboard.' : '🏆 Leaderboard coming soon! Be active to appear here.'}
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((u, i) => (
            <li key={u.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-medium">{u.displayName || u.name || u.userId || u.id}</div>
                  {u.tagline ? <div className="text-xs text-muted-foreground">{u.tagline}</div> : null}
                </div>
              </div>
              <div className="text-sm font-semibold text-amber-400">{u.points ?? 0} XP</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
