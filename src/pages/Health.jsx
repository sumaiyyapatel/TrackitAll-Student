import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Heart, Plus, Activity, Moon, Utensils, Droplet } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';

export default function Health() {
  const { user, addPoints } = useStore();
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
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
      loadHealthData();
    }
  }, [user]);

  const loadHealthData = async () => {
    try {
      const healthQuery = query(
        collection(db, 'health'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const healthSnap = await getDocs(healthQuery);
      const healthDataArray = healthSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHealthData(healthDataArray);
    } catch (error) {
      console.error('Error loading health data:', error);
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
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
      loadHealthData();
    } catch (error) {
      console.error('Error adding health entry:', error);
      toast.error('Failed to log health data');
    }
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisWeek = healthData.filter(entry => new Date(entry.date) >= startOfWeek);
    
    return {
      workouts: thisWeek.filter(e => e.type === 'workout').length,
      avgSleep: (thisWeek.filter(e => e.type === 'sleep').reduce((sum, e) => sum + (e.hours || 0), 0) / thisWeek.filter(e => e.type === 'sleep').length || 0).toFixed(1),
      totalCalories: thisWeek.filter(e => e.type === 'workout').reduce((sum, e) => sum + (e.calories || 0), 0)
    };
  };

  const stats = getWeeklyStats();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Health & Fitness</h1>
            <p className="text-slate-400">Track workouts, sleep, meals, and wellness</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-health-entry-button"
                className="bg-pink-600 hover:bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Health Data
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Log Health Data</DialogTitle>
              </DialogHeader>
              <Tabs value={newEntry.type} onValueChange={(val) => setNewEntry({ ...newEntry, type: val })}>
                <TabsList className="grid w-full grid-cols-3 bg-slate-950">
                  <TabsTrigger value="workout" data-testid="tab-workout">Workout</TabsTrigger>
                  <TabsTrigger value="sleep" data-testid="tab-sleep">Sleep</TabsTrigger>
                  <TabsTrigger value="meal" data-testid="tab-meal">Meal</TabsTrigger>
                </TabsList>
                <form onSubmit={handleAddEntry} className="space-y-4 mt-4">
                  <TabsContent value="workout" className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Duration (minutes)</Label>
                      <Input
                        data-testid="workout-duration-input"
                        type="number"
                        value={newEntry.duration}
                        onChange={(e) => setNewEntry({ ...newEntry, duration: e.target.value })}
                        required
                        placeholder="30"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Intensity</Label>
                      <Select value={newEntry.intensity} onValueChange={(val) => setNewEntry({ ...newEntry, intensity: val })}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Calories Burned</Label>
                      <Input
                        data-testid="workout-calories-input"
                        type="number"
                        value={newEntry.calories}
                        onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value })}
                        placeholder="200"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Description</Label>
                      <Input
                        data-testid="workout-description-input"
                        value={newEntry.description}
                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                        placeholder="Morning run"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sleep" className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Hours of Sleep</Label>
                      <Input
                        data-testid="sleep-hours-input"
                        type="number"
                        step="0.5"
                        value={newEntry.hours}
                        onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                        required
                        placeholder="7.5"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Sleep Quality (1-10)</Label>
                      <Input
                        data-testid="sleep-quality-input"
                        type="number"
                        min="1"
                        max="10"
                        value={newEntry.quality}
                        onChange={(e) => setNewEntry({ ...newEntry, quality: e.target.value })}
                        required
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Notes</Label>
                      <Input
                        data-testid="sleep-notes-input"
                        value={newEntry.description}
                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                        placeholder="Slept well"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="meal" className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Meal Type</Label>
                      <Select value={newEntry.intensity} onValueChange={(val) => setNewEntry({ ...newEntry, intensity: val })}>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                          <SelectItem value="snack">Snack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Description</Label>
                      <Input
                        data-testid="meal-description-input"
                        value={newEntry.description}
                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                        required
                        placeholder="Oats with fruits"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Estimated Calories</Label>
                      <Input
                        data-testid="meal-calories-input"
                        type="number"
                        value={newEntry.calories}
                        onChange={(e) => setNewEntry({ ...newEntry, calories: e.target.value })}
                        placeholder="400"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                  </TabsContent>
                  
                  <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-500">
                    Log Entry
                  </Button>
                </form>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">This Week Workouts</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.workouts}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-pink-500 flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">sessions completed</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Avg Sleep</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.avgSleep}h</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <Moon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">per night</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Calories Burned</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.totalCalories}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">this week</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Activity</h2>
          {healthData.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
              <Heart className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No health data logged yet</h3>
              <p className="text-slate-500 mb-6">Start tracking your health journey</p>
              <Button onClick={() => setShowAdd(true)} className="bg-pink-600 hover:bg-pink-500">
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Entry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {healthData.slice(0, 10).map(entry => (
                <div
                  key={entry.id}
                  data-testid={`health-entry-${entry.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        entry.type === 'workout' ? 'bg-pink-500/20' :
                        entry.type === 'sleep' ? 'bg-violet-500/20' : 'bg-emerald-500/20'
                      }`}>
                        {entry.type === 'workout' && <Activity className="w-6 h-6 text-pink-400" />}
                        {entry.type === 'sleep' && <Moon className="w-6 h-6 text-violet-400" />}
                        {entry.type === 'meal' && <Utensils className="w-6 h-6 text-emerald-400" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {entry.type === 'workout' ? 'Workout Session' :
                           entry.type === 'sleep' ? 'Sleep Log' : 'Meal Log'}
                        </h4>
                        <p className="text-sm text-slate-400 mb-2">{formatDate(entry.date)}</p>
                        {entry.description && <p className="text-slate-300">{entry.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      {entry.type === 'workout' && (
                        <div>
                          <p className="text-2xl font-bold text-pink-400">{entry.duration}min</p>
                          <p className="text-sm text-slate-500">{entry.calories || 0} cal</p>
                        </div>
                      )}
                      {entry.type === 'sleep' && (
                        <div>
                          <p className="text-2xl font-bold text-violet-400">{entry.hours}h</p>
                          <p className="text-sm text-slate-500">Quality: {entry.quality}/10</p>
                        </div>
                      )}
                      {entry.type === 'meal' && (
                        <div>
                          <p className="text-2xl font-bold text-emerald-400">{entry.calories || 0}</p>
                          <p className="text-sm text-slate-500">calories</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}