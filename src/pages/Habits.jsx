import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { CheckCircle2, Circle, Plus, TrendingUp, Calendar as CalendarIcon, Flame } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { POINTS } from '@/utils/gamification';
import { formatDate } from '@/utils/helpers';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekdays', label: 'Weekdays', description: 'Mon-Fri' },
  { value: 'weekly', label: 'Weekly', description: '1x per week' },
  { value: '3x_week', label: '3x per Week', description: '3 days a week' },
  { value: 'custom', label: 'Custom', description: 'Specific days' }
];

export default function Habits() {
  const { user, addPoints } = useStore();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    category: 'Health',
    frequency: 'daily',
    reminder: true
  });

  useEffect(() => {
    if (user) {
      loadHabits();
    }
  }, [user]);

  const loadHabits = async () => {
    try {
      const habitsQuery = query(
        collection(db, 'habits'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const habitsSnap = await getDocs(habitsQuery);
      const habitsData = habitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(habitsData);
    } catch (error) {
      console.error('Error loading habits:', error);
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'habits'), {
        ...newHabit,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        completions: {},
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0
      });
      toast.success('Habit created!');
      setShowAdd(false);
      setNewHabit({ name: '', category: 'Health', frequency: 'daily', reminder: true });
      loadHabits();
    } catch (error) {
      console.error('Error adding habit:', error);
      toast.error('Failed to create habit');
    }
  };

  const handleToggleCompletion = async (habitId, date) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      const dateKey = date.toISOString().split('T')[0];
      const completions = habit.completions || {};
      const isCompleted = completions[dateKey];

      const updatedCompletions = { ...completions };
      if (isCompleted) {
        delete updatedCompletions[dateKey];
      } else {
        updatedCompletions[dateKey] = true;
        addPoints(POINTS.DAILY_STREAK);
      }

      // Calculate streak
      const sortedDates = Object.keys(updatedCompletions).sort().reverse();
      let currentStreak = 0;
      let checkDate = new Date();
      
      for (let i = 0; i < 30; i++) {
        const key = checkDate.toISOString().split('T')[0];
        if (updatedCompletions[key]) {
          currentStreak++;
        } else {
          break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }

      const habitRef = doc(db, 'habits', habitId);
      await updateDoc(habitRef, {
        completions: updatedCompletions,
        currentStreak,
        bestStreak: Math.max(currentStreak, habit.bestStreak || 0),
        totalCompletions: Object.keys(updatedCompletions).length
      });

      if (!isCompleted) {
        toast.success(`+${POINTS.DAILY_STREAK} XP! Habit completed 🔥`);
      }
      loadHabits();
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.error('Failed to update habit');
    }
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const getCompletionRate = (habit) => {
    if (!habit.completions) return 0;
    const last30Days = 30;
    const completedDays = Object.keys(habit.completions).filter(dateStr => {
      const date = new Date(dateStr);
      const daysDiff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
      return daysDiff < last30Days;
    }).length;
    return Math.round((completedDays / last30Days) * 100);
  };

  const last7Days = getLast7Days();

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
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Habit Tracker</h1>
            <p className="text-slate-400">Build lasting habits with daily tracking</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-habit-button"
                className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Create New Habit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddHabit} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Habit Name</Label>
                  <Input
                    data-testid="habit-name-input"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    required
                    placeholder="Drink 8 glasses of water"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <Select value={newHabit.category} onValueChange={(val) => setNewHabit({ ...newHabit, category: val })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Fitness">Fitness</SelectItem>
                      <SelectItem value="Productivity">Productivity</SelectItem>
                      <SelectItem value="Learning">Learning</SelectItem>
                      <SelectItem value="Mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Frequency</Label>
                  <Select value={newHabit.frequency} onValueChange={(val) => setNewHabit({ ...newHabit, frequency: val })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {FREQUENCIES.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label} - {freq.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500">
                  Create Habit
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
                <p className="text-sm text-slate-400 mb-1">Active Habits</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{habits.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Best Streak</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {Math.max(...habits.map(h => h.bestStreak || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">days in a row</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Avg Completion</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h), 0) / habits.length) : 0}%
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Habits List */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Habits</h2>
          {habits.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
              <CheckCircle2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No habits yet</h3>
              <p className="text-slate-500 mb-6">Create your first habit to start building consistency</p>
              <Button onClick={() => setShowAdd(true)} className="bg-violet-600 hover:bg-violet-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map(habit => (
                <div
                  key={habit.id}
                  data-testid={`habit-${habit.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {habit.name}
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                          {habit.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-400" />
                          <span className="text-slate-400">Streak: <span className="text-white font-bold">{habit.currentStreak || 0}</span> days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-400">Best: <span className="text-white font-bold">{habit.bestStreak || 0}</span> days</span>
                        </div>
                        <div className="text-slate-400">Rate: <span className="text-white font-bold">{getCompletionRate(habit)}%</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Last 7 Days */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">Last 7 Days</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {last7Days.map((date, index) => {
                        const dateKey = date.toISOString().split('T')[0];
                        const isCompleted = habit.completions && habit.completions[dateKey];
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={index}
                            data-testid={`habit-day-${habit.id}-${index}`}
                            onClick={() => handleToggleCompletion(habit.id, date)}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 border transition-all ${
                              isCompleted
                                ? 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30'
                                : 'border-white/10 hover:bg-white/5'
                            } ${isToday ? 'ring-2 ring-violet-500' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <Circle className="w-6 h-6 text-slate-600" />
                            )}
                            <span className="text-xs text-slate-400 mt-1">
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </button>
                        );
                      })}
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