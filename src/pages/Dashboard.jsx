import React, { useEffect, useState } from 'react';
import { SmartInsights } from '@/components/SmartInsights';
import { DataExport, EXPORT_COLUMNS } from '@/components/DataExport';
import { DashboardSkeleton } from '@/components/SkeletonScreens';
import { Layout } from '@/components/Layout';
import { QuickActions } from '@/components/QuickActions';
import { QuickLogButtons } from '@/components/QuickLogButtons';
import { RecentActivity } from '@/components/RecentActivity';
import { CatchUpModal } from '@/components/CatchUpModal';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ViewToggle } from '@/components/ViewToggle';
import { SectionHeader } from '@/components/SectionHeader';
import { WellnessHub } from '@/components/WellnessHub';
import useStore from '@/store/useStore';
import { Timer, Target, Flame, Trophy, ChevronLeft, ChevronRight, Calendar, Heart, Smile, BookOpen, RotateCcw } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { normalizeDate } from '@/utils/dateNormalizer';
import { getGreeting, formatDate } from '@/utils/helpers';
import { AnimatedProgress } from '@/components/AnimatedProgress';
import { getProgressHint } from '@/components/EncouragementMessage';
import Leaderboard from '../components/Leaderboard';
import { CATEGORY_THEMES } from '@/utils/categoryColors';

export default function Dashboard() {
  const { user, userStats } = useStore();
  const [metrics, setMetrics] = useState({
    focus: null,
    thisWeek: 0,
    streaks: userStats.streaks?.attendance || 0
  });
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState([]); // record of recent entries across trackers for export and insights
  const [achievementIndex, setAchievementIndex] = useState(0);
  const [dashboardView, setDashboardView] = useState('quick');
  const [weekBreakdown, setWeekBreakdown] = useState({ attendance: 0, expenses: 0, mood: 0, study: 0 });
  const [weeklyActivityDays, setWeeklyActivityDays] = useState([]);
  const [showCatchUp, setShowCatchUp] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
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

      const habitsSnap = await getDocs(query(collection(db, 'habits'), where('userId', '==', user.uid)));
      const habits = habitsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const activeHabit = habits
        .filter(h => h.status !== 'archived')
        .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))[0];

      // Attendance this week
      const attendanceSnap = await getDocs(userRecent(db, 'attendance', user.uid, 200));
      const attendanceDocs = attendanceSnap.docs.map(d => ({ type: 'attendance', ...d.data() }));
      const attendanceThisWeek = attendanceDocs.filter(d => {
        const date = toDate(d.date);
        return date && date >= startOfWeek && d.attended;
      }).length;

      // Expenses this week
      const expensesSnap = await getDocs(userRecent(db, 'expenses', user.uid, 200));
      const expensesDocs = expensesSnap.docs.map(d => ({ type: 'expense', ...d.data() }));
      const expensesThisWeek = expensesDocs.filter(d => {
        const date = toDate(d.date);
        return date && date >= startOfWeek;
      }).length;

      // Mood entries this week
      const moodSnap = await getDocs(userRecent(db, 'mood_entries', user.uid, 200));
      const moodDocs = moodSnap.docs.map(d => ({ type: 'mood', ...d.data() }));
      const moodThisWeek = moodDocs.filter(d => {
        const date = toDate(d.date);
        return date && date >= startOfWeek;
      }).length;

      // Study sessions this week
      const studySnap = await getDocs(userRecent(db, 'study_sessions', user.uid, 200));
      const studyDocs = studySnap.docs.map(d => ({ type: 'study', ...d.data() }));
      const studyThisWeek = studyDocs.filter(d => {
        const date = toDate(d.date || d.createdAt);
        return date && date >= startOfWeek;
      }).length;

      const totalThisWeek = attendanceThisWeek + expensesThisWeek + moodThisWeek + studyThisWeek;

      // Build weekly activity heatmap (which days of this week had activity)
      const allWeekDocs = [
        ...attendanceDocs,
        ...expensesDocs,
        ...moodDocs,
        ...studyDocs,
      ];

      // keep copy for export/insights
      setAllData(allWeekDocs);

      const dayActivity = [false, false, false, false, false, false, false]; // Sun-Sat
      allWeekDocs.forEach(d => {
        const date = toDate(d.date || d.createdAt);
        if (date && date >= startOfWeek) {
          dayActivity[date.getDay()] = true;
        }
      });
      setWeeklyActivityDays(dayActivity);

      setWeekBreakdown({
        attendance: attendanceThisWeek,
        expenses: expensesThisWeek,
        mood: moodThisWeek,
        study: studyThisWeek,
      });

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
        <DashboardSkeleton />
      </Layout>
    );
  }

  const displayedBadges = userStats.badges.slice(-4).reverse();
  const maxStreak = Math.max(
    userStats.streaks?.attendance || 0,
    userStats.streaks?.mood || 0,
    userStats.streaks?.health || 0
  );

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Layout>
      <div className="max-w-container mx-auto space-y-8">
        {/* Hero Section — Enhanced with weekly streak heatmap */}
        {/* Export & Insights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <SmartInsights data={allData} type="health" />
        <DataExport data={allData} columns={[
          { label: 'Type', accessor: r=>r.type },
          { label: 'Date', accessor: r=>formatDate(r.date||r.createdAt) },
        ]} title="Activity" />
      </div>

      <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-6 md:p-8 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Student'}! 👋
              </h1>
              <p className="text-white/80 text-body-sm">Level {userStats.level} • {userStats.points} XP</p>
            </div>
            <div className="flex items-center gap-3">
              {maxStreak > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span className="text-sm font-bold text-white">{maxStreak}d</span>
                </div>
              )}
              {userStats.badges.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span className="text-sm font-bold text-white">{userStats.badges.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Activity Heatmap */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white/60 text-xs font-medium mr-1">This week</span>
            {DAY_LABELS.map((label, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-white/50">{label}</span>
                <div
                  className={`w-6 h-6 rounded-md transition-all ${weeklyActivityDays[idx]
                      ? 'bg-white/90 shadow-sm shadow-white/20'
                      : 'bg-white/15'
                    }`}
                  title={`${DAY_LABELS[idx]} — ${weeklyActivityDays[idx] ? 'Active' : 'No activity'}`}
                />
              </div>
            ))}
          </div>

          <AnimatedProgress
            value={userStats.points % 100}
            max={100}
            label="Level Progress"
            hint={getProgressHint(userStats.points % 100, 100, 'milestone')}
            color="violet"
            size="large"
          />
          <p className="text-white/70 text-xs mt-3">
            {100 - (userStats.points % 100)} XP until level {userStats.level + 1}
          </p>
        </div>

        {/* Quick-Add Buttons — One-click logging */}
        <div>
          <SectionHeader title="Quick Log" subtitle="One-tap logging" level="section" />
          <QuickLogButtons />
        </div>

        {/* Quick Actions — Navigation shortcuts */}
        <div>
          <SectionHeader title="Quick Actions" level="section" />
          <QuickActions />
        </div>

        {/* Wellness Hub — Combined health tracking */}
        <div>
          <SectionHeader title="Daily Wellness" subtitle="Hydration & Weight" level="section" />
          <WellnessHub userId={user.uid} />
        </div>

        {/* Activity Overview - with View Toggle */}
        <div>
          <SectionHeader
            title="This Week"
            subtitle={`${metrics.thisWeek} activities logged`}
            level="section"
            action={<ViewToggle view={dashboardView} onViewChange={setDashboardView} />}
          />

          {/* Quick View: Compact metric cards */}
          {dashboardView === 'quick' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Focus Card */}
              <div className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.habits.border} rounded-2xl p-6 ${CATEGORY_THEMES.habits.hoverBorder} transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">Focus</p>
                    {metrics.focus ? (
                      <>
                        <h3 className="mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {metrics.focus.name}
                        </h3>
                        <p className="text-body-sm text-muted-foreground">
                          {metrics.focus.streak} day streak {metrics.focus.icon}
                        </p>
                      </>
                    ) : (
                      <h3 className="text-muted-foreground">No active focus</h3>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${CATEGORY_THEMES.habits.iconBg} flex items-center justify-center`}>
                    {metrics.focus ? (
                      <Flame className="w-6 h-6 text-white" />
                    ) : (
                      <Target className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* This Week Card */}
              <div className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.study.border} rounded-2xl p-6 ${CATEGORY_THEMES.study.hoverBorder} transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">This Week</p>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {metrics.thisWeek}
                    </h3>
                    <p className="text-body-sm text-muted-foreground">Activities logged</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${CATEGORY_THEMES.study.iconBg} flex items-center justify-center`}>
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Streaks Card */}
              <div className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.attendance.border} rounded-2xl p-6 ${CATEGORY_THEMES.attendance.hoverBorder} transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">Streaks</p>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {maxStreak}
                    </h3>
                    <p className="text-body-sm text-muted-foreground">Best streak</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${CATEGORY_THEMES.attendance.iconBg} flex items-center justify-center`}>
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Detailed View: Expanded category breakdown */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { key: 'attendance', label: 'Attendance', value: weekBreakdown.attendance, icon: Calendar, theme: CATEGORY_THEMES.attendance },
                  { key: 'finance', label: 'Expenses', value: weekBreakdown.expenses, icon: Target, theme: CATEGORY_THEMES.finance },
                  { key: 'mood', label: 'Mood Logs', value: weekBreakdown.mood, icon: Smile, theme: CATEGORY_THEMES.mood },
                  { key: 'study', label: 'Study', value: weekBreakdown.study, icon: BookOpen, theme: CATEGORY_THEMES.study },
                ].map((cat) => (
                  <div key={cat.key} className={`bg-card/50 border ${cat.theme.border} rounded-2xl p-5 ${cat.theme.hoverBorder} transition-all`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-lg ${cat.theme.iconBg} flex items-center justify-center`}>
                        <cat.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-overline uppercase tracking-widest text-muted-foreground">{cat.label}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{cat.value}</p>
                    <p className="text-caption text-muted-foreground mt-1">this week</p>
                  </div>
                ))}
              </div>

              {/* Focus & Streaks in Collapsible */}
              <CollapsibleSection
                title="Focus & Streaks"
                icon={Flame}
                summary={metrics.focus ? `${metrics.focus.name} - ${metrics.focus.streak} day streak` : 'No active focus'}
                badge={`Best: ${maxStreak}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div>
                    <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">Current Focus</p>
                    {metrics.focus ? (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{metrics.focus.icon}</span>
                        <div>
                          <p className="font-semibold">{metrics.focus.name}</p>
                          <p className="text-body-sm text-muted-foreground">{metrics.focus.streak} day streak</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Start a habit to set your focus</p>
                    )}
                  </div>
                  <div>
                    <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">Best Streaks</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Attendance', streak: userStats.streaks?.attendance || 0, theme: CATEGORY_THEMES.attendance },
                        { label: 'Mood', streak: userStats.streaks?.mood || 0, theme: CATEGORY_THEMES.mood },
                        { label: 'Health', streak: userStats.streaks?.health || 0, theme: CATEGORY_THEMES.health },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center justify-between">
                          <span className={`text-body-sm ${s.theme.text}`}>{s.label}</span>
                          <span className="text-body-sm font-bold">{s.streak} days</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}
        </div>

        {/* Recent Activity — Cross-tracker feed */}
        <CollapsibleSection
          title="Recent Activity"
          icon={Timer}
          summary="Latest entries across all trackers"
          defaultOpen={true}
        >
          <RecentActivity />
        </CollapsibleSection>

        {/* Achievements Carousel — Collapsed by default (progressive disclosure) */}
        {displayedBadges.length > 0 && (
          <CollapsibleSection
            title="Recent Achievements"
            icon={Trophy}
            summary={`${displayedBadges.length} badges earned`}
            badge={`${userStats.badges.length} total`}
            defaultOpen={false}
          >
            <div className="relative mt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {displayedBadges.map((badge, index) => (
                  <div
                    key={badge.id || index}
                    data-testid={`badge-${badge.id || index}`}
                    className={`bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all hover:scale-105 animate-slide-up ${index === achievementIndex ? 'ring-2 ring-violet-500' : ''
                      }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-4xl mb-3 animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
                      {badge.icon || '🌟'}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-caption text-muted-foreground">{badge.description || 'Achievement unlocked!'}</p>
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
          </CollapsibleSection>
        )}

        {/* Leaderboard — Collapsed by default (progressive disclosure) */}
        <CollapsibleSection
          title="Leaderboard"
          icon={Trophy}
          summary="See how you compare with friends"
          defaultOpen={false}
        >
          <Leaderboard top={10} friendsOnly={true} />
        </CollapsibleSection>

        {/* Catch Up Button */}
        <button
          onClick={() => setShowCatchUp(true)}
          data-testid="catch-up-button"
          className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border border-dashed border-violet-500/30 text-violet-400 hover:bg-violet-500/5 hover:border-violet-500/50 transition-all group"
        >
          <RotateCcw className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
          <span className="font-medium">Catch up on missed days</span>
        </button>

        {/* Catch Up Modal */}
        <CatchUpModal isOpen={showCatchUp} setIsOpen={setShowCatchUp} />
      </div>
    </Layout>
  );
}
