import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Smile, Plus, TrendingUp, Calendar } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getMoodEmoji, getMoodColor, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';
import { Slider } from '@/components/ui/slider';

const MOOD_FACTORS = ['stress', 'sleep', 'work', 'social', 'health', 'family', 'exercise'];

export default function Mood() {
  const { user, addPoints } = useStore();
  const [moodEntries, setMoodEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMood, setNewMood] = useState({
    mood: 5,
    factors: [],
    journal: ''
  });

  useEffect(() => {
    if (user) {
      loadMoodData();
    }
  }, [user]);

  const loadMoodData = async () => {
    try {
      const moodQuery = query(
        collection(db, 'mood_entries'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const moodSnap = await getDocs(moodQuery);
      const moodData = moodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMoodEntries(moodData);
    } catch (error) {
      console.error('Error loading mood data:', error);
      toast.error('Failed to load mood data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMood = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'mood_entries'), {
        ...newMood,
        date: new Date().toISOString(),
        userId: user.uid
      });
      addPoints(POINTS.LOG_MOOD);
      toast.success(`+${POINTS.LOG_MOOD} XP! Mood logged ${getMoodEmoji(newMood.mood)}`);
      setShowAdd(false);
      setNewMood({ mood: 5, factors: [], journal: '' });
      loadMoodData();
    } catch (error) {
      console.error('Error adding mood:', error);
      toast.error('Failed to log mood');
    }
  };

  const toggleFactor = (factor) => {
    setNewMood(prev => ({
      ...prev,
      factors: prev.factors.includes(factor)
        ? prev.factors.filter(f => f !== factor)
        : [...prev.factors, factor]
    }));
  };

  const getAverageMood = () => {
    if (moodEntries.length === 0) return 0;
    const sum = moodEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return (sum / moodEntries.length).toFixed(1);
  };

  const getMoodTrend = () => {
    if (moodEntries.length < 7) return 'neutral';
    const recent = moodEntries.slice(0, 7).reduce((sum, e) => sum + e.mood, 0) / 7;
    const older = moodEntries.slice(7, 14).reduce((sum, e) => sum + e.mood, 0) / 7;
    if (recent > older + 0.5) return 'up';
    if (recent < older - 0.5) return 'down';
    return 'neutral';
  };

  const trend = getMoodTrend();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Mood Tracker</h1>
            <p className="text-slate-400">Track your daily mood and mental wellbeing</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-mood-button"
                className="bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Mood
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-200">How are you feeling?</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddMood} className="space-y-6">
                <div className="text-center">
                  <div className="text-7xl mb-4">{getMoodEmoji(newMood.mood)}</div>
                  <p className="text-4xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {newMood.mood}/10
                  </p>
                  <Slider
                    data-testid="mood-slider"
                    value={[newMood.mood]}
                    onValueChange={([value]) => setNewMood({ ...newMood, mood: value })}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-3 block">What's affecting your mood?</Label>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_FACTORS.map(factor => (
                      <button
                        key={factor}
                        type="button"
                        data-testid={`mood-factor-${factor}`}
                        onClick={() => toggleFactor(factor)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          newMood.factors.includes(factor)
                            ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {factor}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Journal (Optional)</Label>
                  <Textarea
                    data-testid="mood-journal-input"
                    value={newMood.journal}
                    onChange={(e) => setNewMood({ ...newMood, journal: e.target.value })}
                    placeholder="How was your day? What made you feel this way?"
                    className="bg-slate-950 border-slate-800 text-slate-200 min-h-[100px]"
                  />
                </div>

                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500">
                  Log Mood
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Average Mood</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{getAverageMood()}/10</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-500 flex items-center justify-center shadow-lg">
                <Smile className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">all time average</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Mood Trend</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {trend === 'up' ? '😊' : trend === 'down' ? '😔' : '😐'}
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                trend === 'up' ? 'from-emerald-600 to-emerald-500' :
                trend === 'down' ? 'from-rose-600 to-rose-500' : 'from-slate-600 to-slate-500'
              } flex items-center justify-center shadow-lg`}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Entries</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{moodEntries.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">mood check-ins</p>
          </div>
        </div>

        {/* Mood Calendar/Grid */}
        {moodEntries.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Mood Calendar</h2>
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <div className="grid grid-cols-7 gap-2">
                {moodEntries.slice(0, 35).map((entry, index) => (
                  <div
                    key={entry.id}
                    data-testid={`mood-day-${entry.id}`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 border border-white/5 hover:border-cyan-500/50 transition-all cursor-pointer ${getMoodColor(entry.mood)}/20`}
                  >
                    <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                    <div className="text-xs text-slate-400 mt-1">{entry.mood}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Entries</h2>
          {moodEntries.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
              <Smile className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No mood entries yet</h3>
              <p className="text-slate-500 mb-6">Start tracking your emotional wellbeing</p>
              <Button onClick={() => setShowAdd(true)} className="bg-cyan-600 hover:bg-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Mood
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {moodEntries.slice(0, 10).map(entry => (
                <div
                  key={entry.id}
                  data-testid={`mood-entry-${entry.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl ${getMoodColor(entry.mood)}`}>
                      {getMoodEmoji(entry.mood)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {entry.mood}/10
                        </h4>
                        <p className="text-sm text-slate-400">{formatDate(entry.date)}</p>
                      </div>
                      {entry.factors && entry.factors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {entry.factors.map(factor => (
                            <span
                              key={factor}
                              className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.journal && (
                        <p className="text-slate-300 text-sm leading-relaxed">{entry.journal}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}