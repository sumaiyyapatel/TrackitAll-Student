import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { db, doc, getDoc } from '@/lib/localDb';
import useStore from '@/store/useStore';
import useGameStore from '@/store/useGameStore';
import { useStreakReminder } from '@/lib/game/useReminders';
import { RewardLayer } from '@/components/game/RewardLayer';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import "@/App.css";

// Pages
import Onboarding from '@/pages/Auth';
import Today from '@/pages/Dashboard';
import Track from '@/pages/Track';
import Quests from '@/pages/Quests';
import League from '@/pages/League';
import Attendance from '@/pages/Attendance';
import Finance from '@/pages/Finance';
import Health from '@/pages/Health';
import Mood from '@/pages/Mood';
import Goals from '@/pages/Goals';
import Profile from '@/pages/Profile';
import Habits from '@/pages/Habits';
import Study from '@/pages/Study';
import Social from '@/pages/Social';
import TimeAnalytics from '@/pages/TimeAnalytics';
import Settings from '@/pages/Settings';
import WaterTracker from '@/pages/WaterTracker';
import WeightTracker from '@/pages/WeightTracker';
import RecurringExpenses from '@/pages/RecurringExpenses';
import Challenges from '@/pages/Challenges';

const useReady = () => {
  const user = useStore(s => s.user);
  const onboarded = useGameStore(s => s.settings.onboarded);
  return Boolean(user && onboarded);
};

const PrivateRoute = ({ children }) => {
  const ready = useReady();
  return ready ? children : <Navigate to="/auth" replace />;
};

function App() {
  const { user, setUserStats } = useStore();
  const ready = useReady();
  const checkDay = useGameStore(s => s.checkDay);
  const uid = user?.uid;

  // The local profile is persisted by the store; refresh its stats from local data
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then((userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserStats({
          points: data.points || 0,
          level: data.level || 1,
          badges: data.badges || [],
          streaks: data.streaks || { attendance: 0, mood: 0, health: 0 }
        });
      }
    });
  }, [uid, setUserStats]);

  // Streak breaks/freezes and the weekly league roll over when the day changes
  useEffect(() => {
    if (!ready) return undefined;
    checkDay();
    const onVisible = () => { if (document.visibilityState === 'visible') checkDay(); };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(checkDay, 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [ready, checkDay]);

  useStreakReminder();

  const page = (el) => <PrivateRoute>{el}</PrivateRoute>;

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <Toaster position="top-center" toastOptions={{ className: 'toaster' }} />
        {ready && <RewardLayer />}
        <Routes>
          <Route path="/auth" element={ready ? <Navigate to="/dashboard" replace /> : <Onboarding />} />
          <Route path="/dashboard" element={page(<Today />)} />
          <Route path="/track" element={page(<Track />)} />
          <Route path="/quests" element={page(<Quests />)} />
          <Route path="/league" element={page(<League />)} />
          <Route path="/attendance" element={page(<Attendance />)} />
          <Route path="/finance" element={page(<Finance />)} />
          <Route path="/health" element={page(<Health />)} />
          <Route path="/mood" element={page(<Mood />)} />
          <Route path="/goals" element={page(<Goals />)} />
          <Route path="/habits" element={page(<Habits />)} />
          <Route path="/study" element={page(<Study />)} />
          <Route path="/social" element={page(<Social />)} />
          <Route path="/analytics" element={page(<TimeAnalytics />)} />
          <Route path="/settings" element={page(<Settings />)} />
          <Route path="/profile" element={page(<Profile />)} />
          <Route path="/water" element={page(<WaterTracker />)} />
          <Route path="/weight" element={page(<WeightTracker />)} />
          <Route path="/recurring" element={page(<RecurringExpenses />)} />
          <Route path="/challenges" element={page(<Challenges />)} />
          <Route path="/" element={<Navigate to={ready ? "/dashboard" : "/auth"} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MotionConfig>
    </ThemeProvider>
  );
}

export default App;
