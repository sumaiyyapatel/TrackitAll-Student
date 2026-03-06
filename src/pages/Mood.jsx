import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ViewToggle } from '@/components/ViewToggle';
import { SectionHeader } from '@/components/SectionHeader';
import useStore from '@/store/useStore';
import { Smile, Plus, TrendingUp, Calendar, Trash2, Edit2, X, Grid3X3, Mic, MicOff } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getMoodEmoji, getMoodColor, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';
import { Slider } from '@/components/ui/slider';
import { DataCard } from '@/components/cards/DataCard';
import { CATEGORY_THEMES } from '@/utils/categoryColors';
import { SmartInsights } from '@/components/SmartInsights';
import { DataExport, EXPORT_COLUMNS } from '@/components/DataExport';
import { MoodSkeleton } from '@/components/SkeletonScreens';
import { SearchFilter } from '@/components/SearchFilter';

const MOOD_FACTORS = ['stress', 'sleep', 'work', 'social', 'health', 'family', 'exercise'];

export default function Mood() {
  const { user, addPoints } = useStore();
  const [moodEntries, setMoodEntries] = useState([]);
  const [allMoodEntries, setAllMoodEntries] = useState([]); // keep original copy for filtering
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newMood, setNewMood] = useState({
    mood: 5,
    factors: [],
    journal: ''
  });
  const [moodView, setMoodView] = useState('quick');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (user) {
      loadMoodData();
    }
  }, [user]);

  // voice recognition cleanup
  useEffect(() => {
    return () => {
      if (window._moodRecognition) {
        window._moodRecognition.stop();
        window._moodRecognition = null;
      }
    };
  }, []);

  const loadMoodData = async () => {
    try {
      const moodSnap = await getDocs(userRecent(db, 'mood_entries', user.uid, 200));
      const moodData = moodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMoodEntries(moodData);
      setAllMoodEntries(moodData);
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
      if (editingId) {
        await updateDoc(doc(db, 'mood_entries', editingId), {
          mood: newMood.mood,
          factors: newMood.factors,
          journal: newMood.journal
        });
        toast.success('Mood entry updated!');
      } else {
        await addDoc(collection(db, 'mood_entries'), {
          ...newMood,
          date: new Date().toISOString(),
          userId: user.uid
        });
        addPoints(POINTS.LOG_MOOD);
        toast.success(`+${POINTS.LOG_MOOD} XP! Mood logged ${getMoodEmoji(newMood.mood)}`);
      }
      setShowAdd(false);
      setEditingId(null);
      setNewMood({ mood: 5, factors: [], journal: '' });
      loadMoodData();
    } catch (error) {
      console.error('Error saving mood:', error);
      toast.error('Failed to save mood');
    }
  };

  const handleDeleteMood = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this mood entry?')) return;
    // optimistic UI
    const prev = moodEntries;
    setMoodEntries(ms => ms.filter(m => m.id !== entryId));
    try {
      await deleteDoc(doc(db, 'mood_entries', entryId));
      toast.success('Mood entry deleted');
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      toast.error('Failed to delete mood entry');
      setMoodEntries(prev);
    }
  };

  const handleEditMood = (entry) => {
    setEditingId(entry.id);
    setNewMood({
      mood: entry.mood,
      factors: entry.factors || [],
      journal: entry.journal || ''
    });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setNewMood({ mood: 5, factors: [], journal: '' });
  };

  // Voice-to-text for mood journal
  const startVoiceJournal = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in your browser');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNewMood(prev => ({ ...prev, journal: transcript }));
    };
    recognition.onerror = () => {
      toast.error('Voice input error');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
    toast.info('Listening... speak your thoughts');
    window._moodRecognition = recognition;
  }, []);

  const stopVoiceJournal = useCallback(() => {
    if (window._moodRecognition) {
      window._moodRecognition.stop();
      window._moodRecognition = null;
    }
    setIsListening(false);
  }, []);

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
        <MoodSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Smart insights & export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SmartInsights data={moodEntries} type="mood" />
          <DataExport data={moodEntries} columns={EXPORT_COLUMNS.mood} title="Mood Data" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Mood Tracker"
            subtitle="Track your daily mood and mental wellbeing"
            level="page"
            className="mb-0"
          />
          <div className="flex items-center gap-2">
            <Button
              data-testid="add-mood-button"
              className="bg-cyan-600 hover:bg-cyan-500 "
              onClick={() => setShowAdd(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Mood
            </Button>
          </div>
        </div>

        {/* Add/Edit Mood Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-white/10 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-200">{editingId ? 'Edit Mood Entry' : 'How are you feeling?'}</h2>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
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
                              ? 'bg-cyan-600 text-white '
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {factor}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-slate-300">Journal (Optional)</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant={isListening ? "destructive" : "outline"}
                        onClick={isListening ? stopVoiceJournal : startVoiceJournal}
                        className={`text-xs gap-1.5 ${isListening ? 'animate-pulse' : 'border-white/10'}`}
                        aria-label={isListening ? 'Stop voice input' : 'Start voice input for journal'}
                      >
                        {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        {isListening ? 'Stop' : 'Voice'}
                      </Button>
                    </div>
                    <Textarea
                      data-testid="mood-journal-input"
                      value={newMood.journal}
                      onChange={(e) => setNewMood({ ...newMood, journal: e.target.value })}
                      placeholder="How was your day? What made you feel this way?"
                      className="bg-bg-card border-slate-800 text-slate-200 min-h-[100px]"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500">
                      {editingId ? 'Update Mood' : 'Log Mood'}
                    </Button>
                    <Button type="button" onClick={handleCancel} variant="outline" className="flex-1 border-white/10">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <DataCard
            title="Average Mood"
            value={`${getAverageMood()}/10`}
            icon={Smile}
          />
          <DataCard
            title="Mood Trend"
            value={trend === 'up' ? '😊' : trend === 'down' ? '😔' : '😐'}
            icon={TrendingUp}
          />
          <DataCard
            title="Total Entries"
            value={moodEntries.length}
            icon={Calendar}
          />
        </div>

        {/* Mood Calendar/Grid */}
        {moodEntries.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Mood Calendar</h2>
            <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {moodEntries.slice(0, 35).map((entry, index) => (
                  <div
                    key={entry.id}
                    data-testid={`mood-day-${entry.id}`}
                    className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-1 sm:p-2 text-xs sm:text-sm border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer ${getMoodColor(entry.mood)}/20`}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Recent Entries"
              level="section"
              className="mb-0"
            />
            <div className="flex items-center gap-2">
              <SearchFilter
                data={allMoodEntries}
                onFilter={(filtered) => setMoodEntries(filtered)}
                searchFields={["journal"]}
                placeholder="Search journals..."
                className="w-64"
              />
              <ViewToggle view={moodView} onViewChange={setMoodView} />
            </div>
          </div>
          {moodEntries.length === 0 ? (
            <div className="text-center py-20 bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl">
              <Smile className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No mood entries yet</h3>
              <p className="text-slate-500 mb-6">Start tracking your emotional wellbeing</p>
              <Button onClick={() => setShowAdd(true)} className="bg-cyan-600 hover:bg-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Mood
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {moodEntries.slice(0, moodView === 'quick' ? 5 : 10).map(entry => (
                <div
                  key={entry.id}
                  data-testid={`mood-entry-${entry.id}`}
                  className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 transition-all group"
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-400">{formatDate(entry.date)}</p>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMood(entry)}
                              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteMood(entry.id)}
                              className="border-danger/50 text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
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