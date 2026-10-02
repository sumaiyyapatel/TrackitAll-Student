import React, { useState } from 'react';
import { db, doc, setDoc, getDoc } from '@/lib/localDb';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import { User, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Data lives in this browser only, so there is a single local profile
const LOCAL_UID = 'local-user';

export default function Auth() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setUserStats } = useStore();

  const handleStart = async (e) => {
    e.preventDefault();
    const displayName = name.trim();
    if (!displayName) return;
    setLoading(true);

    try {
      const user = { uid: LOCAL_UID, displayName, email: null, photoURL: null };
      const userRef = doc(db, 'users', LOCAL_UID);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const userData = {
          uid: LOCAL_UID,
          displayName,
          createdAt: new Date().toISOString(),
          points: 20,
          level: 1,
          badges: [{ id: 'first-entry', name: 'Welcome', timestamp: new Date().toISOString() }],
          streaks: { attendance: 0, mood: 0, health: 0 }
        };
        await setDoc(userRef, userData);
        setUserStats({ points: 20, level: 1, badges: userData.badges, streaks: userData.streaks });
        toast.success(`Welcome, ${displayName}!`);
      } else {
        const data = userDoc.data();
        await setDoc(userRef, { displayName }, { merge: true });
        setUserStats({
          points: data.points || 0,
          level: data.level || 1,
          badges: data.badges || [],
          streaks: data.streaks || { attendance: 0, mood: 0, health: 0 }
        });
        toast.success('Welcome back!');
      }

      setUser(user);
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Could not start. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[#8b5cf6]/10" />
      <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")', opacity: 0.5 }} />

  <div className="relative z-10 w-full max-w-md sm:max-w-lg">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8b5cf6] mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            TrackitAll
          </h1>
          <p className="text-slate-400">Your personal student productivity companion</p>
        </div>

        {/* Auth Card */}
        <div className="bg-bg-card backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Get Started
            </h2>
            <p className="text-slate-400 text-sm">
              Your data is saved privately in this browser
            </p>
          </div>

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Your Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  id="name"
                  data-testid="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="bg-slate-950 border-slate-800 text-slate-200 pl-10 focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="submit-button"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.7)] transition-all"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Start Tracking
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Outfit, sans-serif' }}>5+</div>
            <p className="text-xs text-slate-500">Trackers</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#8b5cf6]" style={{ fontFamily: 'Outfit, sans-serif' }}>Real-time</div>
            <p className="text-xs text-slate-500">Analytics</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Outfit, sans-serif' }}>Gamified</div>
            <p className="text-xs text-slate-500">Experience</p>
          </div>
        </div>
      </div>
    </div>
  );
}