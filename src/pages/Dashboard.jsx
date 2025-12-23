import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { QuickActions } from '@/components/QuickActions';
import useStore from '@/store/useStore';
import { Calendar, Wallet, Heart, Smile, Trophy, TrendingUp } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { formatCurrency, getGreeting } from '@/utils/helpers';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { user, userStats } = useStore();
  const [stats, setStats] = useState({
    attendancePercentage: 0,
    monthlyExpenses: 0,
    weeklyWorkouts: 0,
    avgMood: 0,
    activeGoals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

      // Attendance
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid),
        where('date', '>=', startOfMonth)
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendedCount = attendanceSnap.docs.filter(doc => doc.data().attended).length;
      const totalCount = attendanceSnap.size || 1;
      const attendancePercentage = Math.round((attendedCount / totalCount) * 100);

      // Expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        where('date', '>=', startOfMonth)
      );
      const expensesSnap = await getDocs(expensesQuery);
      const monthlyExpenses = expensesSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      // Workouts
      const workoutsQuery = query(
        collection(db, 'health'),
        where('userId', '==', user.uid),
        where('type', '==', 'workout'),
        where('date', '>=', startOfWeek)
      );
      const workoutsSnap = await getDocs(workoutsQuery);
      const weeklyWorkouts = workoutsSnap.size;

      // Mood
      const moodQuery = query(
        collection(db, 'mood_entries'),
        where('userId', '==', user.uid),
        where('date', '>=', startOfMonth)
      );
      const moodSnap = await getDocs(moodQuery);
      const totalMood = moodSnap.docs.reduce((sum, doc) => sum + (doc.data().mood || 0), 0);
      const avgMood = moodSnap.size > 0 ? (totalMood / moodSnap.size).toFixed(1) : 0;

      // Goals
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid),
        where('status', '==', 'active')
      );
      const goalsSnap = await getDocs(goalsQuery);
      const activeGoals = goalsSnap.size;

      setStats({
        attendancePercentage,
        monthlyExpenses,
        weeklyWorkouts,
        avgMood,
        activeGoals
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div data-testid="dashboard-header">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-slate-400">Here's what's happening with your goals today</p>
        </div>

        {/* Level Progress */}
        <div className="bg-gradient-to-r from-violet-600 to-pink-600 rounded-2xl p-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white text-lg font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Level {userStats.level}
              </h3>
              <p className="text-white/80 text-sm">{userStats.points} / {userStats.level * 100} XP</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-300" />
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {userStats.badges.length}
              </span>
            </div>
          </div>
          <Progress value={(userStats.points % 100)} className="h-3 bg-white/20" />
          <p className="text-white/70 text-xs mt-2">
            {100 - (userStats.points % 100)} XP until level {userStats.level + 1}
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>This Month Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Attendance Rate"
              value={`${stats.attendancePercentage}%`}
              icon={Calendar}
              color="violet"
              trend="up"
              trendValue="+5%"
              testId="stat-attendance"
            />
            <StatCard
              title="Monthly Spending"
              value={formatCurrency(stats.monthlyExpenses)}
              icon={Wallet}
              color="amber"
              trend="down"
              trendValue="-12%"
              testId="stat-spending"
            />
            <StatCard
              title="Weekly Workouts"
              value={stats.weeklyWorkouts}
              icon={Heart}
              color="pink"
              trend="up"
              trendValue="+2"
              testId="stat-workouts"
            />
            <StatCard
              title="Average Mood"
              value={`${stats.avgMood}/10`}
              icon={Smile}
              color="cyan"
              testId="stat-mood"
            />
            <StatCard
              title="Active Goals"
              value={stats.activeGoals}
              icon={TrendingUp}
              color="emerald"
              testId="stat-goals"
            />
            <StatCard
              title="Streak Days"
              value={userStats.streaks.attendance || 0}
              icon={Trophy}
              color="rose"
              testId="stat-streak"
            />
          </div>
        </div>

        {/* Recent Badges */}
        {userStats.badges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userStats.badges.slice(-4).reverse().map((badge, index) => (
                <div
                  key={index}
                  data-testid={`badge-${badge.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all"
                >
                  <div className="text-4xl mb-2">{badge.icon || '🌟'}</div>
                  <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                  <p className="text-xs text-slate-500">{badge.description || 'Achievement unlocked!'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}