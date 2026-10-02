import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { db, doc, getDoc } from '@/lib/localDb';
import useStore from '@/store/useStore';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import "@/App.css";

// Pages
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
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

const PrivateRoute = ({ children }) => {
  const { user } = useStore();
  return user ? children : <Navigate to="/auth" replace />;
};

function App() {
  const { user, setUserStats } = useStore();
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

  return (
    <ThemeProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'toaster',
        }}
      />
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/finance" element={<PrivateRoute><Finance /></PrivateRoute>} />
          <Route path="/health" element={<PrivateRoute><Health /></PrivateRoute>} />
          <Route path="/mood" element={<PrivateRoute><Mood /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/habits" element={<PrivateRoute><Habits /></PrivateRoute>} />
          <Route path="/study" element={<PrivateRoute><Study /></PrivateRoute>} />
          <Route path="/social" element={<PrivateRoute><Social /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><TimeAnalytics /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/water" element={<PrivateRoute><WaterTracker /></PrivateRoute>} />
          <Route path="/weight" element={<PrivateRoute><WeightTracker /></PrivateRoute>} />
          <Route path="/recurring" element={<PrivateRoute><RecurringExpenses /></PrivateRoute>} />
          <Route path="/challenges" element={<PrivateRoute><Challenges /></PrivateRoute>} />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </ThemeProvider>
  );
}

export default App;
