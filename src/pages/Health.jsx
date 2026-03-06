import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SectionHeader } from '@/components/SectionHeader';
import useStore from '@/store/useStore';
import { Heart, Plus, Activity, Moon, Utensils, Droplet, Trash2, Edit2, X, Smile, BarChart3 } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { normalizeDate } from '@/utils/dateNormalizer';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { HealthForm } from '@/components/forms/HealthForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDate, getMoodEmoji } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';
import { CATEGORY_THEMES } from '@/utils/categoryColors';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SmartInsights } from '@/components/SmartInsights';
import { DataExport, EXPORT_COLUMNS } from '@/components/DataExport';
import { HealthSkeleton } from '@/components/SkeletonScreens';

export default function Health() {
  const { user, addPoints } = useStore();
  const [healthData, setHealthData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('workout');
  const [newEntry, setNewEntry] = useState({
    type: 'workout',
    duration: '',
    intensity: 'medium',
    description: '',
    calories: '',
    hours: '',
    quality: '7'
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      const [healthSnap, moodSnap] = await Promise.all([
        getDocs(userRecent(db, 'health', user.uid, 100)),
        getDocs(userRecent(db, 'mood_entries', user.uid, 100))
      ]);
      
      setHealthData(healthSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setMoodData(moodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const entry = {
        ...newEntry,
        date: new Date().toISOString(),
        userId: user.uid
      };
      
      if (newEntry.type === 'workout') {
        entry.duration = parseInt(newEntry.duration);
        entry.calories = parseInt(newEntry.calories);
      } else if (newEntry.type === 'sleep') {
        entry.hours = parseFloat(newEntry.hours);
        entry.quality = parseInt(newEntry.quality);
      }

      await addDoc(collection(db, 'health'), entry);
      addPoints(POINTS.LOG_HEALTH);
      toast.success(`+${POINTS.LOG_HEALTH} XP! Health data logged`);
      setShowAdd(false);
      setNewEntry({ type: 'workout', duration: '', intensity: 'medium', description: '', calories: '', hours: '', quality: '7' });
      loadAllData();
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSubmitting(false);
    }
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const thisWeekHealth = healthData.filter(e => normalizeDate(e.date) >= startOfWeek);
    const thisWeekMood = moodData.filter(e => normalizeDate(e.date) >= startOfWeek);
    
    return {
      workouts: thisWeekHealth.filter(e => e.type === 'workout').length,
      sleep: (thisWeekHealth.filter(e => e.type === 'sleep').reduce((acc, e) => acc + (e.hours || 0), 0) / (thisWeekHealth.filter(e => e.type === 'sleep').length || 1)).toFixed(1),
      mood: (thisWeekMood.reduce((acc, e) => acc + (e.mood || 0), 0) / (thisWeekMood.length || 1)).toFixed(1),
      meals: thisWeekHealth.filter(e => e.type === 'meal').length
    };
  };

  const stats = getWeeklyStats();
  const latestMood = moodData[0]?.mood || 5;

  if (loading) return <Layout><HealthSkeleton /></Layout>;

  return (
    <Layout>
      <div className="max-w-container mx-auto space-y-8">
        {/* Smart Insights */}
        <SmartInsights data={healthData} type="health" />

        {/* Hero Card */}
        <div className={`bg-gradient-to-br ${CATEGORY_THEMES.health.gradient} rounded-2xl p-8 text-white`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-white mb-2">Feeling {latestMood > 7 ? 'Great' : latestMood > 4 ? 'Okay' : 'Tired'}?</h1>
              <p className="text-emerald-50/80">You've completed {stats.workouts} workouts this week. Keep pushing! 🚀</p>
            </div>
            <div className="flex items-center gap-4 bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <div className="text-4xl">{getMoodEmoji(latestMood)}</div>
              <div>
                <p className="text-xs uppercase font-bold text-emerald-100">Latest Mood</p>
                <p className="text-xl font-bold">{latestMood}/10</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Week Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {[
            { label: 'Workouts', value: stats.workouts, icon: Activity, color: 'text-orange-400', bgColor: CATEGORY_THEMES.health.bg, borderColor: CATEGORY_THEMES.health.border },
            { label: 'Avg Sleep', value: `${stats.sleep}h`, icon: Moon, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
            { label: 'Avg Mood', value: stats.mood, icon: Smile, color: 'text-yellow-400', bgColor: CATEGORY_THEMES.mood.bg, borderColor: CATEGORY_THEMES.mood.border },
            { label: 'Meals Logged', value: stats.meals, icon: Utensils, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
          ].map((item, idx) => (
            <div key={idx} className={`bg-card/50 border ${item.borderColor} p-5 rounded-2xl flex items-center gap-4 hover:bg-card/70 transition-all`}>
              <div className={`p-2.5 rounded-xl ${item.bgColor} ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-overline uppercase tracking-widest text-muted-foreground font-medium">{item.label}</p>
                <p className="text-xl font-bold mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Section */}
        <CollapsibleSection
          title="Health Metrics"
          icon={BarChart3}
          summary={`${stats.workouts} workouts, ${stats.sleep}h avg sleep this week`}
          defaultOpen={true}
          borderColor={CATEGORY_THEMES.health.border}
        >
          <Tabs defaultValue="workout" onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-muted w-full md:w-auto overflow-x-auto">
                <TabsTrigger value="workout">Workouts</TabsTrigger>
                <TabsTrigger value="sleep">Sleep</TabsTrigger>
                <TabsTrigger value="meal">Meals</TabsTrigger>
                <TabsTrigger value="mood">Mood</TabsTrigger>
              </TabsList>
              <DataExport data={healthData} columns={EXPORT_COLUMNS.health} title="Health Data" />
            </div>

            <TabsContent value="workout" className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={healthData.filter(e => e.type === 'workout').slice(0, 7).reverse()}>
                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, {weekday: 'short'})} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="duration" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-4">
                {healthData.filter(e => e.type === 'workout').slice(0, 5).map(e => (
                  <div key={e.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                    <div>
                      <p className="font-bold">{e.description || 'Workout'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{e.duration} min</p>
                      <p className="text-xs text-emerald-400">{e.calories} kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sleep" className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthData.filter(e => e.type === 'sleep').slice(0, 7).reverse()}>
                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, {weekday: 'short'})} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-4">
                {healthData.filter(e => e.type === 'sleep').slice(0, 5).map(e => (
                  <div key={e.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                    <div>
                      <p className="font-bold">{e.hours} Hours</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Quality: {e.quality}/10</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="meal" className="space-y-4">
              <div className="grid gap-4">
                {healthData.filter(e => e.type === 'meal').slice(0, 10).map(e => (
                  <div key={e.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold capitalize">{e.intensity}</p>
                        <p className="text-xs text-muted-foreground">{e.description}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold">{e.calories} kcal</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="mood" className="space-y-6">
              <div className="grid grid-cols-7 gap-2">
                {moodData.slice(0, 14).reverse().map(e => (
                  <div key={e.id} className="aspect-square flex flex-col items-center justify-center bg-muted/30 rounded-xl border border-border hover:border-violet-500/30 transition-all">
                    <span className="text-2xl">{getMoodEmoji(e.mood)}</span>
                    <span className="text-[10px] text-muted-foreground mt-1">{new Date(e.date).toLocaleDateString(undefined, {weekday: 'short'})}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CollapsibleSection>
      </div>

      {/* Add Button */}
      <Button 
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg bg-violet-600 hover:bg-violet-500 lg:bottom-10"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <ResponsiveDialog
        isOpen={showAdd}
        setIsOpen={setShowAdd}
        title="Log Health Entry"
        description="Track your workouts, sleep, and meals"
      >
        <HealthForm
          newEntry={newEntry}
          setNewEntry={setNewEntry}
          onSubmit={handleAddEntry}
          submitting={submitting}
        />
      </ResponsiveDialog>
    </Layout>
  );
}
