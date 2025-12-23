import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Scale, Plus, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightTracker() {
  const { user } = useStore();
  const [weightLogs, setWeightLogs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState({ weight: '', goal: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWeightData();
    }
  }, [user]);

  const loadWeightData = async () => {
    try {
      const weightQuery = query(
        collection(db, 'weight_logs'),
        where('userId', '==', user.uid),
        orderBy('date', 'asc')
      );
      const weightSnap = await getDocs(weightQuery);
      const logs = weightSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWeightLogs(logs);
    } catch (error) {
      console.error('Error loading weight data:', error);
      toast.error('Failed to load weight data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'weight_logs'), {
        weight: parseFloat(newWeight.weight),
        goal: newWeight.goal ? parseFloat(newWeight.goal) : null,
        date: new Date().toISOString(),
        userId: user.uid
      });
      toast.success('Weight logged!');
      setShowAdd(false);
      setNewWeight({ weight: '', goal: '' });
      loadWeightData();
    } catch (error) {
      console.error('Error adding weight:', error);
      toast.error('Failed to log weight');
    }
  };

  const getCurrentWeight = () => weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 0;
  const getStartWeight = () => weightLogs.length > 0 ? weightLogs[0].weight : 0;
  const getWeightChange = () => {
    if (weightLogs.length < 2) return 0;
    return getCurrentWeight() - getStartWeight();
  };
  const getGoalWeight = () => weightLogs.length > 0 && weightLogs[weightLogs.length - 1].goal || 0;

  const chartData = weightLogs.map(log => ({
    date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: log.weight,
    goal: log.goal
  }));

  const weightChange = getWeightChange();
  const currentWeight = getCurrentWeight();
  const goalWeight = getGoalWeight();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Weight Tracker</h1>
            <p className="text-slate-400">Track your weight journey and progress</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button data-testid="add-weight-button" className="bg-violet-600 hover:bg-violet-500">
                <Plus className="w-4 h-4 mr-2" />
                Log Weight
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Log Weight</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWeight} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Current Weight (kg)</Label>
                  <Input
                    data-testid="weight-input"
                    type="number"
                    step="0.1"
                    value={newWeight.weight}
                    onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                    required
                    placeholder="70.5"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Goal Weight (kg) - Optional</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newWeight.goal}
                    onChange={(e) => setNewWeight({ ...newWeight, goal: e.target.value })}
                    placeholder="65.0"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500">
                  Log Weight
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Current Weight</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {currentWeight.toFixed(1)}
                </h3>
                <p className="text-sm text-slate-500 mt-1">kg</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <Scale className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Change</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                </h3>
                <p className="text-sm text-slate-500 mt-1">kg</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg ${
                weightChange > 0 ? 'from-amber-600 to-amber-500' : 'from-emerald-600 to-emerald-500'
              }`}>
                {weightChange > 0 ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Goal Weight</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {goalWeight > 0 ? goalWeight.toFixed(1) : '-'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">kg</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        {weightLogs.length > 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Weight Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 6 }} name="Weight" />
                {goalWeight > 0 && (
                  <Line type="monotone" dataKey="goal" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Goal" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center">
            <Scale className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-400">No weight logs yet</h3>
            <p className="text-slate-500 mb-6">Start tracking your weight journey</p>
            <Button onClick={() => setShowAdd(true)} className="bg-violet-600 hover:bg-violet-500">
              <Plus className="w-4 h-4 mr-2" />
              Log Your First Weight
            </Button>
          </div>
        )}

        {/* Recent Logs */}
        {weightLogs.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Logs</h2>
            <div className="space-y-3">
              {weightLogs.slice(-10).reverse().map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl">
                  <div>
                    <p className="font-semibold">{log.weight} kg</p>
                    <p className="text-xs text-slate-500">{formatDate(log.date)}</p>
                  </div>
                  {log.goal && (
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Goal: {log.goal} kg</p>
                      <p className="text-xs text-slate-500">{Math.abs(log.weight - log.goal).toFixed(1)} kg to go</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}