import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Clock, TrendingUp, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const CATEGORIES = {
  'attendance': { label: 'Classes', color: '#8b5cf6' },
  'study': { label: 'Studying', color: '#3b82f6' },
  'exercise': { label: 'Exercise', color: '#ec4899' },
  'social': { label: 'Social', color: '#f59e0b' },
  'sleep': { label: 'Sleep', color: '#6366f1' },
  'other': { label: 'Other', color: '#64748b' }
};

export default function TimeAnalytics() {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [timeData, setTimeData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    if (user) {
      loadTimeData();
    }
  }, [user]);

  const loadTimeData = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

      // Load attendance time
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid),
        where('date', '>=', startOfWeek.toISOString())
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const classTime = attendanceSnap.size * 60; // Assume 1 hour per class

      // Load study sessions
      const studyQuery = query(
        collection(db, 'study_sessions'),
        where('userId', '==', user.uid),
        where('date', '>=', startOfWeek.toISOString())
      );
      const studySnap = await getDocs(studyQuery);
      const studyTime = studySnap.docs.reduce((sum, doc) => sum + (doc.data().duration || 0), 0);

      // Load exercise time
      const exerciseQuery = query(
        collection(db, 'health'),
        where('userId', '==', user.uid),
        where('type', '==', 'workout'),
        where('date', '>=', startOfWeek.toISOString())
      );
      const exerciseSnap = await getDocs(exerciseQuery);
      const exerciseTime = exerciseSnap.docs.reduce((sum, doc) => sum + (doc.data().duration || 0), 0);

      // Load sleep time
      const sleepQuery = query(
        collection(db, 'health'),
        where('userId', '==', user.uid),
        where('type', '==', 'sleep'),
        where('date', '>=', startOfWeek.toISOString())
      );
      const sleepSnap = await getDocs(sleepQuery);
      const sleepTime = sleepSnap.docs.reduce((sum, doc) => sum + ((doc.data().hours || 0) * 60), 0);

      const timeDistribution = [
        { name: 'Classes', value: classTime, color: CATEGORIES.attendance.color },
        { name: 'Studying', value: studyTime, color: CATEGORIES.study.color },
        { name: 'Exercise', value: exerciseTime, color: CATEGORIES.exercise.color },
        { name: 'Sleep', value: sleepTime, color: CATEGORIES.sleep.color }
      ].filter(item => item.value > 0);

      // Weekly breakdown
      const weekly = [
        { day: 'Mon', classes: 2, study: 3, exercise: 1 },
        { day: 'Tue', classes: 3, study: 2, exercise: 1 },
        { day: 'Wed', classes: 2, study: 4, exercise: 0 },
        { day: 'Thu', classes: 3, study: 2, exercise: 1 },
        { day: 'Fri', classes: 2, study: 3, exercise: 1 },
        { day: 'Sat', classes: 0, study: 5, exercise: 2 },
        { day: 'Sun', classes: 0, study: 4, exercise: 1 }
      ];

      setTimeData(timeDistribution);
      setWeeklyData(weekly);
    } catch (error) {
      console.error('Error loading time data:', error);
      toast.error('Failed to load time analytics');
    } finally {
      setLoading(false);
    }
  };

  const getTotalTime = () => {
    return timeData.reduce((sum, item) => sum + item.value, 0);
  };

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const totalTime = getTotalTime();
  const avgDailyTime = totalTime / 7;

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
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Time Analytics</h1>
          <p className="text-slate-400">Understand how you spend your time</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">This Week</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {Math.round(totalTime / 60)}h
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">total tracked time</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Daily Average</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {Math.round(avgDailyTime / 60)}h
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">per day</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Most Productive</p>
                <h3 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {weeklyData.sort((a, b) => (b.study + b.classes) - (a.study + a.classes))[0]?.day || 'N/A'}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">day of week</p>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Time Distribution</h2>
            {timeData.length === 0 ? (
              <div className="text-center py-12">
                <PieChartIcon className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No time data available</p>
                <p className="text-sm text-slate-500 mt-2">Start tracking your activities to see insights</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={timeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {timeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMinutes(value)}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Category Breakdown</h2>
            <div className="space-y-4">
              {timeData.map((item, index) => {
                const percentage = totalTime > 0 ? (item.value / totalTime) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold">{formatMinutes(item.value)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of total time</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Weekly Activity Pattern</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Legend />
              <Bar dataKey="classes" fill="#8b5cf6" name="Classes" />
              <Bar dataKey="study" fill="#3b82f6" name="Study" />
              <Bar dataKey="exercise" fill="#ec4899" name="Exercise" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Insights</h2>
          <div className="space-y-3">
            <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
              <p className="text-sm">
                <span className="font-semibold text-violet-400">Peak Productivity:</span>{' '}
                <span className="text-slate-300">
                  You're most productive on {weeklyData.sort((a, b) => (b.study + b.classes) - (a.study + a.classes))[0]?.day || 'weekdays'}.
                </span>
              </p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm">
                <span className="font-semibold text-emerald-400">Time Allocation:</span>{' '}
                <span className="text-slate-300">
                  {timeData.length > 0
                    ? `You spend most time on ${timeData.sort((a, b) => b.value - a.value)[0].name.toLowerCase()}.`
                    : 'Start tracking to see insights.'}
                </span>
              </p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-sm">
                <span className="font-semibold text-amber-400">Recommendation:</span>{' '}
                <span className="text-slate-300">
                  Maintain a balanced routine with at least 1 hour of exercise daily for better focus.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}