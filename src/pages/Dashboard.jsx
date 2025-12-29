import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { QuickActions } from '@/components/QuickActions';
import useStore from '@/store/useStore';
import { Timer, Target, Flame, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { normalizeDate } from '@/utils/dateNormalizer';
import { getGreeting } from '@/utils/helpers';
import { AnimatedProgress } from '@/components/AnimatedProgress';
import { getProgressHint } from '@/components/EncouragementMessage';
import Leaderboard from '../components/Leaderboard';

export default function Dashboard() {
  const { user, userStats } = useStore();
  const [metrics, setMetrics] = useState({
    focus: null, // Pomodoro or active habit
    thisWeek: 0, // Aggregated metric
    streaks: userStats.streaks?.attendance || 0
  });
  const [loading, setLoading] = useState(true);
  const [achievementIndex, setAchievementIndex] = useState(0);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    // Auto-rotate achievements carousel
    if (userStats.badges.length > 4) {
      const interval = setInterval(() => {
        setAchievementIndex((prev) => (prev + 1) % Math.min(userStats.badges.length, 4));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [userStats.badges.length]);

  const loadDashboardData = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const toDate = normalizeDate;

      // Check for active Pomodoro (from Study page - we'll check if there's a recent active session)
      // For now, we'll check for the most active habit instead
      const habitsSnap = await getDocs(query(collection(db, 'habits'), where('userId', '==', user.uid)));
      const habits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Get the habit with the highest current streak
      const activeHabit = habits
        .filter(h => h.status !== 'archived')
        .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))[0];

      // Calculate this week's activities
      const weekActivities = [];
      
      // Attendance this week
      const attendanceSnap = await getDocs(userRecent(db, 'attendance', user.uid, 200));
      const attendanceThisWeek = attendanceSnap.docs
        .map(d => d.data())
        .filter(d => {
          const date = toDate(d.date);
          return date && date >= startOfWeek && d.attended;
        }).length;

      // Expenses this week
      const expensesSnap = await getDocs(userRecent(db, 'expenses', user.uid, 200));
      const expensesThisWeek = expensesSnap.docs
        .map(d => d.data())
        .filter(d => {
          const date = toDate(d.date);
          return date && date >= startOfWeek;
        }).length;

      // Mood entries this week
      const moodSnap = await getDocs(userRecent(db, 'mood_entries', user.uid, 200));
      const moodThisWeek = moodSnap.docs
        .map(d => d.data())
        .filter(d => {
          const date = toDate(d.date);
          return date && date >= startOfWeek;
        }).length;

      // Study sessions this week
      const studySnap = await getDocs(userRecent(db, 'study_sessions', user.uid, 200));
      const studyThisWeek = studySnap.docs
        .map(d => d.data())
        .filter(d => {
          const date = toDate(d.date || d.createdAt);
          return date && date >= startOfWeek;
        }).length;

      const totalThisWeek = attendanceThisWeek + expensesThisWeek + moodThisWeek + studyThisWeek;

      setMetrics({
        focus: activeHabit ? {
          type: 'habit',
          name: activeHabit.name,
          streak: activeHabit.currentStreak || 0,
          icon: '🔥'
        } : null,
        thisWeek: totalThisWeek,
        streaks: userStats.streaks?.attendance || 0
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
        <div className="space-y-4">
          <div className="h-32 bg-card/50 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const displayedBadges = userStats.badges.slice(-4).reverse();
  const maxStreak = Math.max(
    userStats.streaks?.attendance || 0,
    userStats.streaks?.mood || 0,
    userStats.streaks?.health || 0
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-6 md:p-8 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Student'}! 👋
              </h1>
              <p className="text-white/80 text-sm sm:text-base">Level {userStats.level} • {userStats.points} XP</p>
            </div>
            {userStats.badges.length > 0 && (
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-300" />
                <span className="text-2xl font-bold text-white">{userStats.badges.length}</span>
              </div>
            )}
          </div>
          <AnimatedProgress
            value={userStats.points % 100}
            max={100}
            label="Level Progress"
            hint={getProgressHint(userStats.points % 100, 100, 'milestone')}
            color="violet"
            size="large"
          />
          <p className="text-white/70 text-xs mt-2">
            {100 - (userStats.points % 100)} XP until level {userStats.level + 1}
          </p>
        </div>

        {/* Quick Actions - Exactly 4 */}
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Quick Actions</h2>
          <QuickActions />
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Focus Card */}
          <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6 hover:border-violet-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Focus</p>
                {metrics.focus ? (
                  <>
                    <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {metrics.focus.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {metrics.focus.streak} day streak {metrics.focus.icon}
                    </p>
                  </>
                ) : (
                  <h3 className="text-lg text-muted-foreground">No active focus</h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
                {metrics.focus ? (
                  <Flame className="w-6 h-6 text-white" />
                ) : (
                  <Target className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* This Week Card */}
          <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6 hover:border-violet-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <h3 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {metrics.thisWeek}
                </h3>
                <p className="text-xs text-muted-foreground">Activities logged</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Streaks Card */}
          <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6 hover:border-violet-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Streaks</p>
                <h3 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {maxStreak}
                </h3>
                <p className="text-xs text-muted-foreground">Best streak</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Carousel - Limited to 4 */}
        {displayedBadges.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Achievements</h2>
            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {displayedBadges.map((badge, index) => (
                  <div
                    key={badge.id || index}
                    data-testid={`badge-${badge.id || index}`}
                    className={`bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all hover:scale-105 animate-slide-up ${
                      index === achievementIndex ? 'ring-2 ring-violet-500' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-4xl mb-2 animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
                      {badge.icon || '🌟'}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">{badge.description || 'Achievement unlocked!'}</p>
                  </div>
                ))}
              </div>
              {displayedBadges.length > 1 && (
                <>
                  <button
                    onClick={() => setAchievementIndex((prev) => (prev - 1 + displayedBadges.length) % displayedBadges.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label="Previous achievement"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setAchievementIndex((prev) => (prev + 1) % displayedBadges.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label="Next achievement"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard - Friends Only, Capped at 10 */}
        <Leaderboard top={10} friendsOnly={true} />
      </div>
    </Layout>
  );
}
