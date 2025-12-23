import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import useStore from '@/store/useStore';
import { Toaster } from 'sonner';
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
  const { user, setUser, setUserStats } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Load user stats from Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserStats({
            points: data.points || 0,
            level: data.level || 1,
            badges: data.badges || [],
            streaks: data.streaks || { attendance: 0, mood: 0, health: 0 }
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading TrackitAll...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f8fafc',
          },
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
    </>
  );
}

export default App;
