import React, { useState, useEffect } from 'react';
import { Droplets, Dumbbell, CheckCircle, Check, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import { POINTS } from '@/utils/gamification';
import { CATEGORY_THEMES } from '@/utils/categoryColors';

export const QuickLogButtons = () => {
  const { user, addPoints } = useStore();
  const [loadingWater, setLoadingWater] = useState(false);
  const [loadingWorkout, setLoadingWorkout] = useState(false);
  const [doneWater, setDoneWater] = useState(false);
  const [doneWorkout, setDoneWorkout] = useState(false);

  // Habits state
  const [habits, setHabits] = useState([]);
  const [showHabits, setShowHabits] = useState(false);
  const [togglingHabit, setTogglingHabit] = useState(null);

  useEffect(() => {
    if (user) loadTodayHabits();
  }, [user]);

  const loadTodayHabits = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'habits'), where('userId', '==', user.uid))
      );
      const today = new Date().toISOString().split('T')[0];
      const allHabits = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(h => h.status !== 'archived');

      // Mark which ones are completed today
      const mapped = allHabits.map(h => ({
        ...h,
        completedToday: !!(h.completions && h.completions[today])
      }));
      setHabits(mapped);
    } catch (err) {
      console.error('Error loading habits:', err);
    }
  };

  const handleLogWater = async () => {
    if (loadingWater || doneWater) return;
    setLoadingWater(true);
    try {
      await addDoc(collection(db, 'water_intake'), {
        glasses: 1,
        date: new Date().toISOString(),
        userId: user.uid
      });
      addPoints(POINTS.DAILY_STREAK);
      toast.success(`💧 +${POINTS.DAILY_STREAK} XP! Water logged!`);
      setDoneWater(true);
      setTimeout(() => setDoneWater(false), 3000);
    } catch (err) {
      toast.error('Failed to log water');
    } finally {
      setLoadingWater(false);
    }
  };

  const handleLogWorkout = async () => {
    if (loadingWorkout || doneWorkout) return;
    setLoadingWorkout(true);
    try {
      await addDoc(collection(db, 'health'), {
        type: 'workout',
        duration: 30,
        calories: 200,
        intensity: 'medium',
        description: 'Quick workout',
        date: new Date().toISOString(),
        userId: user.uid
      });
      addPoints(POINTS.LOG_HEALTH);
      toast.success(`🏋️ +${POINTS.LOG_HEALTH} XP! Workout logged!`);
      setDoneWorkout(true);
      setTimeout(() => setDoneWorkout(false), 3000);
    } catch (err) {
      toast.error('Failed to log workout');
    } finally {
      setLoadingWorkout(false);
    }
  };

  const handleToggleHabit = async (habit) => {
    if (togglingHabit === habit.id) return;
    setTogglingHabit(habit.id);
    try {
      const today = new Date().toISOString().split('T')[0];
      const completions = { ...(habit.completions || {}) };

      if (completions[today]) {
        delete completions[today];
      } else {
        completions[today] = true;
        addPoints(POINTS.DAILY_STREAK);
      }

      // Calculate streak
      let currentStreak = 0;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const check = new Date(now);
        check.setDate(check.getDate() - i);
        const key = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, '0')}-${String(check.getDate()).padStart(2, '0')}`;
        if (completions[key]) {
          currentStreak++;
        } else if (i === 0) {
          break;
        } else {
          break;
        }
      }

      const habitRef = doc(db, 'habits', habit.id);
      await updateDoc(habitRef, {
        completions,
        currentStreak,
        bestStreak: Math.max(currentStreak, habit.bestStreak || 0),
        totalCompletions: Object.keys(completions).length
      });

      if (!habit.completedToday) {
        toast.success(`+${POINTS.DAILY_STREAK} XP! Habit completed 🔥`);
      }
      loadTodayHabits();
    } catch (err) {
      toast.error('Failed to update habit');
    } finally {
      setTogglingHabit(null);
    }
  };

  const incompleteHabits = habits.filter(h => !h.completedToday);

  const buttons = [
    {
      label: 'Drank Water',
      icon: doneWater ? Check : Droplets,
      loading: loadingWater,
      done: doneWater,
      onClick: handleLogWater,
      bg: 'bg-cyan-600',
      hoverBg: 'hover:bg-cyan-500',
      testId: 'quick-log-water'
    },
    {
      label: 'Logged Workout',
      icon: doneWorkout ? Check : Dumbbell,
      loading: loadingWorkout,
      done: doneWorkout,
      onClick: handleLogWorkout,
      bg: CATEGORY_THEMES.health.iconBg,
      hoverBg: 'hover:bg-emerald-500',
      testId: 'quick-log-workout'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.testId}
              data-testid={btn.testId}
              onClick={btn.onClick}
              disabled={btn.loading}
              className={`${btn.done ? 'bg-emerald-600' : btn.bg} ${btn.hoverBg} text-white font-semibold py-4 px-5 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-70`}
            >
              {btn.loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-sm">{btn.done ? 'Done!' : btn.label}</span>
            </button>
          );
        })}

        {/* Habit Check Button */}
        <button
          data-testid="quick-log-habit"
          onClick={() => setShowHabits(!showHabits)}
          className={`${CATEGORY_THEMES.habits.iconBg} hover:bg-rose-500 text-white font-semibold py-4 px-5 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 relative`}
        >
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Habits</span>
          {incompleteHabits.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-rose-600 text-xs font-bold rounded-full flex items-center justify-center">
              {incompleteHabits.length}
            </span>
          )}
        </button>
      </div>

      {/* Inline Habits List */}
      {showHabits && habits.length > 0 && (
        <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-4 space-y-2 animate-slide-up">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Today's Habits</p>
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => handleToggleHabit(habit)}
              disabled={togglingHabit === habit.id}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                habit.completedToday
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-muted/30 border border-border hover:border-rose-500/30'
              }`}
            >
              {togglingHabit === habit.id ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
              ) : (
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  habit.completedToday
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-muted-foreground'
                }`}>
                  {habit.completedToday && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
              <span className={`text-sm font-medium flex-1 ${habit.completedToday ? 'line-through text-muted-foreground' : ''}`}>
                {habit.name}
              </span>
              {habit.currentStreak > 0 && (
                <span className="text-xs text-amber-400">🔥 {habit.currentStreak}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
