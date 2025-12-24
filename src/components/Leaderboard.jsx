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

  if (loading) {
    return (
      <div className="p-3 bg-white rounded shadow-sm">
        <div className="text-sm text-muted">Loading leaderboard…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-yellow-50 rounded border border-yellow-100">
        <div className="font-medium">Leaderboard unavailable</div>
        <div className="text-sm mt-1">{error}</div>
        <div className="mt-2">
          <button
            onClick={load}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-3 bg-white rounded shadow-sm">
        <div className="font-medium">No leaderboard entries yet</div>
        <div className="text-sm mt-1">Be the first to earn points!</div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Leaderboard</h3>
        <span className="text-xs text-gray-500">Top {top}</span>
      </div>
      <ol className="list-decimal list-inside space-y-2">
        {items.map((u, i) => (
          <li key={u.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-700">
                {i + 1}
              </div>
              <div>
                <div className="text-sm font-medium">{u.displayName || u.name || u.userId || u.id}</div>
                {u.tagline ? <div className="text-xs text-gray-500">{u.tagline}</div> : null}
              </div>
            </div>
            <div className="text-sm font-semibold">{u.points ?? 0}</div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;
