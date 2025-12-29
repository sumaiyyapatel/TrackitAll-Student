import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Clock, TrendingUp, Calendar, PieChart as PieChartIcon } from 'lucide-react';
import { getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { normalizeDate } from '@/utils/dateNormalizer';
import { toast } from 'sonner';
import { DataCard } from '@/components/cards/DataCard';

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
    } else {
      // if no user, ensure we stop loading spinner
      setLoading(false);
    }
  }, [user]);

  const loadTimeData = async () => {
    try {
      setLoading(true);

      // compute start of week (Monday) at local midnight
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysSinceMonday = (today.getDay() + 6) % 7; // Monday=0
      const startOfWeekDate = new Date(today);
      startOfWeekDate.setDate(today.getDate() - daysSinceMonday);

      const toDate = (v) => normalizeDate(v);

      // Canonical query limit - tune based on expected dataset size
      const CANONICAL_LIMIT = 500;

      // Attendance: fetch canonical set then filter by date client-side
      const attendanceSnap = await getDocs(userRecent(db, 'attendance', user.uid, CANONICAL_LIMIT));
      const attendanceDocs = attendanceSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const classTime = attendanceDocs
        .filter(d => {
          const dt = toDate(d.date ?? d.createdAt ?? d.created_at ?? d.timestamp);
          return dt && dt >= startOfWeekDate;
        })
        .reduce((sum, d) => sum + (d.duration || 60), 0); // fallback to 60 minutes per class

      // Study sessions: canonical query then aggregate client-side
      const studySnap = await getDocs(userRecent(db, 'study_sessions', user.uid, CANONICAL_LIMIT));
      const studyDocs = studySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const studyTime = studyDocs
        .filter(d => {
          const dt = toDate(d.date ?? d.createdAt ?? d.created_at ?? d.timestamp);
          return dt && dt >= startOfWeekDate;
        })
        .reduce((sum, d) => sum + (d.duration || 0), 0);

      // Health: single canonical query for all types, filter in JS
      const healthSnap = await getDocs(userRecent(db, 'health', user.uid, CANONICAL_LIMIT));
      const healthDocs = healthSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const exerciseTime = healthDocs
        .filter(d => {
          const dt = toDate(d.date ?? d.createdAt ?? d.created_at ?? d.timestamp);
          return dt && dt >= startOfWeekDate && (d.type === 'workout' || d.type === 'exercise');
        })
        .reduce((sum, d) => sum + (d.duration || 0), 0);

      const sleepTime = healthDocs
        .filter(d => {
          const dt = toDate(d.date ?? d.createdAt ?? d.created_at ?? d.timestamp);
          return dt && dt >= startOfWeekDate && d.type === 'sleep';
        })
        .reduce((sum, d) => sum + ((d.hours || 0) * 60), 0);

      const timeDistribution = [
        { name: 'Classes', value: classTime, color: CATEGORIES.attendance.color },
        { name: 'Studying', value: studyTime, color: CATEGORIES.study.color },
        { name: 'Exercise', value: exerciseTime, color: CATEGORIES.exercise.color },
        { name: 'Sleep', value: sleepTime, color: CATEGORIES.sleep.color }
      ].filter(item => item.value > 0);

      // Weekly breakdown: aggregate per-day (Mon-Sun) from fetched docs
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekStart = new Date(startOfWeekDate);
      const weekEnd = new Date(startOfWeekDate);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weeklyAgg = dayLabels.map((label) => ({ day: label, classes: 0, study: 0, exercise: 0 }));

      // Attendance -> classes count per day
      attendanceDocs.forEach((d) => {
        const dt = toDate(d.date ?? d.createdAt ?? d.created_at ?? d.timestamp);
        if (!dt || dt < weekStart || dt >= weekEnd) return;
        const idx = (dt.getDay() + 6) % 7; // Monday=0
        weeklyAgg[idx].classes += 1;
      });

      // Study sessions -> accumulate hours per day
      studyDocs.forEach((d) => {
        const dt = toDate(d.date ?? d.createdAt ?? d.created_at ?? d.timestamp);
        if (!dt || dt < weekStart || dt >= weekEnd) return;
        const idx = (dt.getDay() + 6) % 7;
        weeklyAgg[idx].study += (d.duration || 0) / 60; // convert minutes to hours
      });

      // Health workouts -> accumulate hours per day
      healthDocs.forEach((d) => {
        const dt = toDate(d.date ?? d.createdAt ?? d.created_at ?? d.timestamp);
        if (!dt || dt < weekStart || dt >= weekEnd) return;
        const idx = (dt.getDay() + 6) % 7;
        if (d.type === 'sleep') return;
        if (d.type === 'workout' || d.type === 'exercise') {
          weeklyAgg[idx].exercise += (d.duration || 0) / 60; // minutes -> hours
        }
      });

      // Round study/exercise values to one decimal for nicer charts
      weeklyAgg.forEach((w) => {
        w.study = Math.round((w.study + Number.EPSILON) * 10) / 10;
        w.exercise = Math.round((w.exercise + Number.EPSILON) * 10) / 10;
      });

      setTimeData(timeDistribution);
      setWeeklyData(weeklyAgg);
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

  // compute derived non-mutating values
  const mostProductiveDay = (() => {
    if (!weeklyData || weeklyData.length === 0) return 'N/A';
    return weeklyData.reduce((best, cur) => {
      const bestScore = (best.study || 0) + (best.classes || 0);
      const curScore = (cur.study || 0) + (cur.classes || 0);
      return curScore > bestScore ? cur : best;
    }, weeklyData[0]).day;
  })();

  const topCategoryName = (() => {
    if (!timeData || timeData.length === 0) return null;
    return [...timeData].sort((a, b) => b.value - a.value)[0].name.toLowerCase();
  })();

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
          <DataCard
            title="This Week"
            value={`${Math.round(totalTime / 60)}h`}
            icon={Clock}
          />
          <DataCard
            title="Daily Average"
            value={`${Math.round(avgDailyTime / 60)}h`}
            icon={TrendingUp}
          />
          <DataCard
            title="Most Productive"
            value={mostProductiveDay || 'N/A'}
            icon={Calendar}
          />
        </div>

        {/* Time Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Time Distribution</h2>
            {timeData.length === 0 ? (
              <div className="text-center py-12">
                <PieChartIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
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

          <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
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
        <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
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
        <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Insights</h2>
          <div className="space-y-3">
            <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
              <p className="text-sm">
                <span className="font-semibold text-violet-400">Peak Productivity:</span>{' '}
                <span className="text-slate-300">
                  You're most productive on {mostProductiveDay || 'weekdays'}.
                </span>
              </p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm">
                <span className="font-semibold text-emerald-400">Time Allocation:</span>{' '}
                <span className="text-slate-300">
                  {timeData.length > 0
                    ? `You spend most time on ${topCategoryName}.`
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