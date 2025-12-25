import React, { useEffect, useState } from 'react';
import fetchTopLeaderboard from '../utils/leaderboard';
import { db } from '@/firebase/config';

const Leaderboard = ({ top = 10 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopLeaderboard(db, top);
      setItems(data);
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
  }, [top]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Leaderboard</h3>
          <p className="text-xs text-slate-400">Top {top} users</p>
        </div>
        <div className="text-sm text-slate-300">🔥</div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">📊 Loading leaderboard...</div>
      ) : error ? (
        <div className="p-3 bg-amber-900/20 rounded border border-amber-800">
          <div className="font-medium text-amber-200">Leaderboard unavailable</div>
          <div className="text-sm mt-1 text-amber-200">{error}</div>
          <div className="mt-2">
            <button onClick={load} className="px-3 py-1 bg-violet-600 text-white rounded text-sm">Try again</button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-400">🏆 Leaderboard coming soon! Be active to appear here.</div>
      ) : (
        <ol className="space-y-3">
          {items.map((u, i) => (
            <li key={u.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-100">{u.displayName || u.name || u.userId || u.id}</div>
                  {u.tagline ? <div className="text-xs text-slate-400">{u.tagline}</div> : null}
                </div>
              </div>
              <div className="text-sm font-semibold text-amber-300">{u.points ?? 0}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
