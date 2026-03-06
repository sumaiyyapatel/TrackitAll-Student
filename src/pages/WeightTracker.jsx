import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Scale, Plus, TrendingUp, TrendingDown, Target, Trash2, Edit2, X } from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DataCard } from '@/components/cards/DataCard';

export default function WeightTracker() {
  const { user } = useStore();
  const [weightLogs, setWeightLogs] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newWeight, setNewWeight] = useState({ weight: '', goal: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWeightData();
    }
  }, [user]);

  const loadWeightData = async () => {
    try {
      const weightSnap = await getDocs(userRecent(db, 'weight_logs', user.uid, 200));
      let logs = weightSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // ensure ascending order by date for charts
      logs = logs.sort((a, b) => new Date(a.date) - new Date(b.date));
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
      const currentGoal = getGoalWeight();
      if (editingId) {
        await updateDoc(doc(db, 'weight_logs', editingId), {
          weight: parseFloat(newWeight.weight),
          goal: newWeight.goal ? parseFloat(newWeight.goal) : (currentGoal || null),
        });
        toast.success('Weight updated!');
      } else {
        await addDoc(collection(db, 'weight_logs'), {
          weight: parseFloat(newWeight.weight),
          goal: newWeight.goal ? parseFloat(newWeight.goal) : (currentGoal || null),
          date: new Date().toISOString(),
          userId: user.uid
        });
        toast.success('Weight logged!');
      }
      setShowAdd(false);
      setEditingId(null);
      setNewWeight({ weight: '', goal: '' });
      loadWeightData();
    } catch (error) {
      console.error('Error saving weight:', error);
      toast.error('Failed to save weight');
    }
  };

  const handleEditLog = (log) => {
    setEditingId(log.id);
    setNewWeight({ weight: log.weight.toString(), goal: log.goal ? log.goal.toString() : '' });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setNewWeight({ weight: '', goal: '' });
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this log?')) return;
    try {
      await deleteDoc(doc(db, 'weight_logs', logId));
      toast.success('Log deleted');
      loadWeightData();
    } catch (error) {
      console.error('Error deleting weight log:', error);
      toast.error('Failed to delete log');
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
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) handleCancel(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-weight-button" className="bg-violet-600 hover:bg-violet-500">
                <Plus className="w-4 h-4 mr-2" />
                Log Weight
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-200">{editingId ? 'Edit Weight' : 'Log Weight'}</DialogTitle>
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
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-500">
                    {editingId ? 'Update' : 'Log Weight'}
                  </Button>
                  <Button type="button" onClick={handleCancel} variant="outline" className="flex-1 border-white/10">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <DataCard
            title="Current Weight"
            value={`${currentWeight.toFixed(1)} kg`}
            icon={Scale}
          />
          <DataCard
            title="Change"
            value={`${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`}
            icon={weightChange > 0 ? TrendingUp : TrendingDown}
          />
          <DataCard
            title="Goal Weight"
            value={goalWeight > 0 ? `${goalWeight.toFixed(1)} kg` : '-'}
            icon={Target}
          />
        </div>

        {/* Chart */}
        {weightLogs.length > 0 ? (
          <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
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
          <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
              <Scale className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
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
          <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Logs</h2>
            <div className="space-y-3">
              {weightLogs.slice(-10).reverse().map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-bg-card rounded-xl group">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditLog(log)}
                        className="p-2 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <p className="font-semibold">{log.weight} kg</p>
                      <p className="text-xs text-slate-500">{formatDate(log.date)}</p>
                    </div>
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