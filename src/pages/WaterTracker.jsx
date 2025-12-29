import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Droplets, Plus, TrendingUp, Calendar, Award, Minus, RotateCcw } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { normalizeDate } from '@/utils/dateNormalizer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { POINTS } from '@/utils/gamification';
import { formatDate } from '@/utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DAILY_GOAL = 8; // 8 glasses

export default function WaterTracker() {
  const { user, addPoints } = useStore();
  const [waterLogs, setWaterLogs] = useState([]);
  const [todayGlasses, setTodayGlasses] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWaterData();
    }
  }, [user]);

  const loadWaterData = async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const getStartOfWeek = (date = new Date()) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay(); // 0=Sun, 1=Mon...
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
      };
      const startOfWeek = getStartOfWeek(now);

      const snap = await getDocs(userRecent(db, 'water_intake', user.uid, 500));
      const allLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load today's water intake
      const todayLogs = allLogs.filter(l => {
        const d = normalizeDate(l.date);
        return d && d >= startOfDay;
      });
      const todayTotal = todayLogs.reduce((sum, doc) => sum + (doc.glasses || 0), 0);

      // Weekly logs
      const weeklyLogs = allLogs.filter(l => {
        const d = normalizeDate(l.date);
        return d && d >= startOfWeek;
      });

      // Group by day for chart
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMap = {};
      
      weeklyLogs.forEach(log => {
        const d = normalizeDate(log.date);
        if (d) {
          const dayIdx = (d.getDay() + 6) % 7; // Convert 0=Sun to 6=Sun, 1=Mon to 0=Mon
          const dayName = days[dayIdx];
          dayMap[dayName] = (dayMap[dayName] || 0) + (log.glasses || 0);
        }
      });

      const chartData = days.map(day => ({
        day,
        glasses: dayMap[day] || 0
      }));

      setTodayGlasses(todayTotal);
      setWaterLogs(allLogs); // keep all for potential deletions
      setWeeklyData(chartData);
    } catch (error) {
      console.error('Error loading water data:', error);
      toast.error('Failed to load water data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGlass = async () => {
    try {
      await addDoc(collection(db, 'water_intake'), {
        glasses: 1,
        date: new Date().toISOString(),
        userId: user.uid
      });
      
      const newTotal = todayGlasses + 1;
      setTodayGlasses(newTotal);
      
      if (newTotal === DAILY_GOAL) {
        addPoints(POINTS.DAILY_STREAK);
        toast.success(`🎉 +${POINTS.DAILY_STREAK} XP! Daily goal achieved!`);
      } else {
        toast.success('💧 Glass logged!');
      }
      
      loadWaterData();
    } catch (error) {
      console.error('Error adding water:', error);
      toast.error('Failed to log water');
    }
  };

  const handleRemoveGlass = async () => {
    if (todayGlasses <= 0) return;
    
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Find the most recent log from today
      const todayLogs = waterLogs
        .filter(l => {
          const d = normalizeDate(l.date);
          return d && d >= startOfDay;
        })
        .sort((a, b) => normalizeDate(b.date) - normalizeDate(a.date));

      if (todayLogs.length > 0) {
        await deleteDoc(doc(db, 'water_intake', todayLogs[0].id));
        toast.success('Glass removed');
        loadWaterData();
      }
    } catch (error) {
      console.error('Error removing water:', error);
      toast.error('Failed to remove glass');
    }
  };

  const handleResetToday = async () => {
    if (todayGlasses <= 0) return;
    if (!window.confirm('Are you sure you want to reset today\'s intake?')) return;

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayLogs = waterLogs.filter(l => {
        const d = normalizeDate(l.date);
        return d && d >= startOfDay;
      });

      await Promise.all(todayLogs.map(l => deleteDoc(doc(db, 'water_intake', l.id))));
      toast.success('Today\'s intake reset');
      loadWaterData();
    } catch (error) {
      console.error('Error resetting water:', error);
      toast.error('Failed to reset intake');
    }
  };

  const progress = Math.min((todayGlasses / DAILY_GOAL) * 100, 100);
  const avgWeekly = weeklyData.reduce((sum, day) => sum + day.glasses, 0) / 7;

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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Water Tracker 💧</h1>
          <p className="text-slate-400">Stay hydrated for better health and focus</p>
        </div>

        {/* Today's Progress */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-cyan-500/20 mb-4">
              <Droplets className="w-16 h-16 text-cyan-400" />
            </div>
            <h2 className="text-6xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {todayGlasses}/{DAILY_GOAL}
            </h2>
            <p className="text-slate-300">glasses today</p>
          </div>

          <Progress value={progress} className="h-4 mb-4" />
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              data-testid="add-water-glass"
              onClick={handleAddGlass}
              className="bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] px-4 sm:px-8 py-3 sm:py-6 text-base sm:text-lg"
            >
              <Plus className="w-6 h-6 mr-2" />
              Add Glass
            </Button>
            <Button
              onClick={handleRemoveGlass}
              disabled={todayGlasses <= 0}
              variant="outline"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-4 sm:px-8 py-3 sm:py-6 text-base sm:text-lg"
            >
              <Minus className="w-6 h-6 mr-2" />
              Remove
            </Button>
            <Button
              onClick={handleResetToday}
              disabled={todayGlasses <= 0}
              variant="ghost"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-4 sm:px-8 py-3 sm:py-6 text-base sm:text-lg"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Reset
            </Button>
          </div>

          {todayGlasses >= DAILY_GOAL && (
            <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center">
              <Award className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <p className="text-emerald-400 font-semibold">🎉 Daily goal achieved! Great job staying hydrated!</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Weekly Average</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {avgWeekly.toFixed(1)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-500 flex items-center justify-center shadow-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">glasses per day</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">This Week</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {weeklyData.reduce((sum, day) => sum + day.glasses, 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">total glasses</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Progress</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {Math.round(progress)}%
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">of daily goal</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Weekly Hydration</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#f8fafc' }}
              />
              <Line type="monotone" dataKey="glasses" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tips */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Hydration Tips 💡</h2>
          <div className="space-y-3">
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <p className="text-sm text-slate-300"><span className="font-semibold text-cyan-400">Morning Boost:</span> Start your day with 2 glasses of water</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-slate-300"><span className="font-semibold text-blue-400">Before Meals:</span> Drink a glass 30 minutes before eating</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm text-slate-300"><span className="font-semibold text-emerald-400">Exercise:</span> Extra 2-3 glasses when you workout</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}