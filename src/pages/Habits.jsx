import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { CheckCircle2, Circle, Plus, TrendingUp, Calendar as CalendarIcon, Flame, Trash2, Edit2, X } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { normalizeDate } from '@/utils/dateNormalizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { POINTS } from '@/utils/gamification';
import { formatDate } from '@/utils/helpers';
import { EncouragementMessage } from '@/components/EncouragementMessage';
import { DataCard } from '@/components/cards/DataCard';

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
  const [editingId, setEditingId] = useState(null);
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
      // Note: this collection currently uses `createdAt` for ordering.
      // We intentionally avoid ordering by createdAt in Firestore to keep queries canonical.
      // Client-side we sort by createdAt after fetching by userId only. Consider migrating to `date` later.
      const habitsQuery = query(collection(db, 'habits'), where('userId', '==', user.uid));
      const habitsSnap = await getDocs(habitsQuery);
      const habitsData = habitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // normalize and sort by createdAt desc (fallback to ensure stable ordering)
      habitsData.sort((a, b) => {
        const da = normalizeDate(a.createdAt) || new Date(0);
        const dbt = normalizeDate(b.createdAt) || new Date(0);
        return dbt - da;
      });
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
      if (editingId) {
        await updateDoc(doc(db, 'habits', editingId), {
          name: newHabit.name,
          category: newHabit.category,
          frequency: newHabit.frequency,
          reminder: newHabit.reminder
        });
        toast.success('Habit updated!');
      } else {
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
      }
      setShowAdd(false);
      setEditingId(null);
      setNewHabit({ name: '', category: 'Health', frequency: 'daily', reminder: true });
      loadHabits();
    } catch (error) {
      console.error('Error saving habit:', error);
      toast.error('Failed to save habit');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm('Are you sure you want to delete this habit? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'habits', habitId));
      toast.success('Habit deleted');
      loadHabits();
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Failed to delete habit');
    }
  };

  const handleEditHabit = (habit) => {
    setEditingId(habit.id);
    setNewHabit({
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      reminder: habit.reminder !== undefined ? habit.reminder : true
    });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setNewHabit({ name: '', category: 'Health', frequency: 'daily', reminder: true });
  };

  const handleToggleCompletion = async (habitId, date) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      // validate whether this date is allowed for the habit's frequency
      const isDateValidForHabit = (d, habitObj) => {
        const dayOfWeek = d.getDay(); // 0=Sun,1=Mon
        switch (habitObj.frequency) {
          case 'daily': return true;
          case 'weekdays': return dayOfWeek !== 0 && dayOfWeek !== 6;
          case 'weekly': return dayOfWeek === 1; // Monday
          case '3x_week': return [1,3,5].includes(dayOfWeek); // Mon, Wed, Fri
          case 'custom': return habitObj.daysSelected?.includes(dayOfWeek);
          default: return true;
        }
      };

      if (!isDateValidForHabit(date, habit)) {
        toast.error(`This habit is not scheduled for ${date.toLocaleDateString()}`);
        return;
      }

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

      // Calculate streak with local-date awareness
      const calculateStreak = (completionsObj) => {
        if (!completionsObj || Object.keys(completionsObj).length === 0) return 0;
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dateKeyFn = (d) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        for (let i = 0; i < 365; i++) {
          const check = new Date(today);
          check.setDate(check.getDate() - i);
          const key = dateKeyFn(check);
          if (completionsObj[key]) {
            currentStreak++;
          } else if (i === 0) {
            // today's not completed
            break;
          } else {
            break;
          }
        }
        return currentStreak;
      };

      const currentStreak = calculateStreak(updatedCompletions);
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
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) handleCancel(); }}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-habit-button"
                className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-200">{editingId ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
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
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500">
                    {editingId ? 'Update Habit' : 'Create Habit'}
                  </Button>
                  <Button type="button" onClick={handleCancel} variant="outline" className="flex-1 border-white/10">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Active Habits</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{habits.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#8b5cf6] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Best Streak</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {Math.max(...habits.map(h => h.bestStreak || 0), 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">days in a row</p>
          </div>

          <DataCard
            title="Avg Completion"
            value={`${habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h), 0) / habits.length) : 0}%`}
            icon={TrendingUp}
          />
        </div>

        {/* Habits List */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Habits</h2>
          {habits.length === 0 ? (
            <div className="text-center py-20 bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
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
                  className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-all"
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
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditHabit(habit)}
                          className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="border-danger/50 text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Flame className={`w-4 h-4 text-amber-400 ${habit.currentStreak >= 7 ? 'animate-pulse' : ''}`} />
                          <span className="text-muted-foreground">Streak: <span className="text-foreground font-bold">{habit.currentStreak || 0}</span> days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          <span className="text-muted-foreground">Best: <span className="text-foreground font-bold">{habit.bestStreak || 0}</span> days</span>
                        </div>
                        <div className="text-muted-foreground">Rate: <span className="text-foreground font-bold">{getCompletionRate(habit)}%</span></div>
                      </div>
                      {habit.currentStreak >= 7 && (
                        <EncouragementMessage 
                          type="streak" 
                          className="mt-3"
                        />
                      )}
                    </div>
                  </div>

                  {/* Last 7 Days */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">Last 7 Days</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                      {last7Days.map((date, index) => {
                        const dateKey = date.toISOString().split('T')[0];
                        const isCompleted = habit.completions && habit.completions[dateKey];
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={index}
                            data-testid={`habit-day-${habit.id}-${index}`}
                            onClick={() => handleToggleCompletion(habit.id, date)}
                            className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-1 sm:p-2 text-xs sm:text-sm border transition-all ${
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