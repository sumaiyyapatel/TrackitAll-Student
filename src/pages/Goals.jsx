import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Target, Plus, Check, Clock, TrendingUp, Trash2, X } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { calculateDaysRemaining, getGoalProgress, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';
import InlineEditable from '@/components/InlineEditable';
import { AnimatedProgress } from '@/components/AnimatedProgress';
import { Celebration } from '@/components/ui/Celebration';
import { EncouragementMessage, getProgressHint } from '@/components/EncouragementMessage';
import { DataCard } from '@/components/cards/DataCard';
import { SearchFilter } from '@/components/SearchFilter';
import { DataExport, EXPORT_COLUMNS } from '@/components/DataExport';
import { GoalsSkeleton } from '@/components/SkeletonScreens';

const CATEGORIES = ['Health', 'Finance', 'Academic', 'Personal', 'Career'];

export default function Goals() {
  const { user, addPoints } = useStore();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [filteredGoals, setFilteredGoals] = useState(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'Personal',
    targetValue: '',
    currentProgress: 0,
    deadline: '',
    status: 'active'
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid)
      );
      const goalsSnap = await getDocs(goalsQuery);
      const goalsData = goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'goals'), {
        ...newGoal,
        targetValue: parseFloat(newGoal.targetValue),
        createdAt: new Date().toISOString(),
        userId: user.uid
      });
      addPoints(POINTS.LOG_DATA);
      toast.success(`+${POINTS.LOG_DATA} XP! Goal created`);
      setShowAdd(false);
      setNewGoal({ title: '', description: '', category: 'Personal', targetValue: '', currentProgress: 0, deadline: '', status: 'active' });
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleUpdateProgress = async (goalId, newProgress) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const goal = goals.find(g => g.id === goalId);
      const progress = Math.min(newProgress, goal.targetValue);
      const wasCompleted = goal.status === 'completed';
      const isNowCompleted = progress >= goal.targetValue;
      
      await updateDoc(goalRef, {
        currentProgress: progress,
        status: isNowCompleted ? 'completed' : 'active'
      });

      if (isNowCompleted && !wasCompleted) {
        addPoints(POINTS.COMPLETE_GOAL);
        setCelebrationMessage(`Goal "${goal.title}" completed! 🎉`);
        setShowCelebration(true);
        toast.success(`+${POINTS.COMPLETE_GOAL} XP! Goal completed! 🎉`);
      } else {
        const progressHint = getProgressHint(progress, goal.targetValue, 'progress');
        toast.success(progressHint);
      }
      
      loadGoals();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleSaveGoalField = async (goalId, field, newValue) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      const payload = {};
      if (field === 'targetValue') {
        payload[field] = parseFloat(newValue) || 0;
      } else {
        payload[field] = newValue;
      }
      await updateDoc(goalRef, payload);
      toast.success('Goal updated');
      loadGoals();
    } catch (error) {
      console.error('Error saving goal field:', error);
      toast.error('Failed to save');
      throw error; // rethrow so InlineEditable can show its toast if needed
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) return;
    // Optimistic UI
    const previousGoals = goals;
    setGoals(prev => prev.filter(g => g.id !== goalId));
    try {
      await deleteDoc(doc(db, 'goals', goalId));
      toast.success('Goal deleted');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
      setGoals(previousGoals);
    }
  };

  const activeGoals = (filteredGoals || goals).filter(g => g.status === 'active');
  const completedGoals = (filteredGoals || goals).filter(g => g.status === 'completed');

  const handleFilterChange = useCallback((filtered) => {
    setFilteredGoals(filtered);
  }, []);

  if (loading) {
    return (
      <Layout>
        <GoalsSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <Celebration 
        show={showCelebration} 
        message={celebrationMessage}
        onComplete={() => setShowCelebration(false)}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Goals</h1>
            <p className="text-slate-400">Set and track your personal goals</p>
          </div>
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) setNewGoal({ title: '', description: '', category: 'Personal', targetValue: '', currentProgress: 0, deadline: '', status: 'active' }); }}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-goal-button"
                className="bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Create New Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGoal} className="space-y-4" onReset={handleAddGoal}>
                <div>
                  <Label className="text-slate-300">Goal Title</Label>
                  <Input
                    data-testid="goal-title-input"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    required
                    placeholder="Read 10 books this month"
                    className="bg-bg-card border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Description</Label>
                  <Textarea
                    data-testid="goal-description-input"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Why is this goal important?"
                    className="bg-bg-card border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <Select value={newGoal.category} onValueChange={(val) => setNewGoal({ ...newGoal, category: val })}>
                    <SelectTrigger data-testid="goal-category-select" className="bg-bg-card border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-slate-200">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Target Value</Label>
                  <Input
                    data-testid="goal-target-input"
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                    required
                    placeholder="10"
                    className="bg-bg-card border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Deadline</Label>
                  <Input
                    data-testid="goal-deadline-input"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="bg-bg-card border-slate-800 text-slate-200"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                    Create Goal
                  </Button>
                  <Button type="button" onClick={() => setShowAdd(false)} variant="outline" className="flex-1 border-white/10">
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
            title="Active Goals"
            value={activeGoals.length}
            icon={Target}
          />
          <DataCard
            title="Completed"
            value={completedGoals.length}
            icon={Check}
          />
          <DataCard
            title="Success Rate"
            value={`${goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%`}
            icon={TrendingUp}
          />
        </div>

        {/* Search, Filter & Export */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <SearchFilter
            data={goals}
            onFilter={handleFilterChange}
            searchFields={['title', 'description', 'category']}
            categories={CATEGORIES}
            statuses={['active', 'completed']}
            placeholder="Search goals..."
            className="flex-1"
          />
          <DataExport data={goals} columns={EXPORT_COLUMNS.goals} title="Goals" />
        </div>

        {/* Active Goals */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Active Goals</h2>
          {activeGoals.length === 0 ? (
            <div className="text-center py-20 bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl">
              <Target className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No active goals</h3>
              <p className="text-slate-500 mb-6">Create your first goal and start achieving</p>
              <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeGoals.map(goal => {
                const progress = getGoalProgress(goal.currentProgress, goal.targetValue);
                const daysRemaining = calculateDaysRemaining(goal.deadline);
                return (
                  <div
                    key={goal.id}
                    data-testid={`goal-${goal.id}`}
                    className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                            {goal.category}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="border-danger/50 text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          <InlineEditable
                            value={goal.title}
                            onSave={(val) => handleSaveGoalField(goal.id, 'title', val)}
                          />
                        </h3>
                        {goal.description && (
                          <p className="text-sm text-slate-400">{goal.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <AnimatedProgress
                        value={goal.currentProgress}
                        max={goal.targetValue}
                        label="Progress"
                        hint={getProgressHint(goal.currentProgress, goal.targetValue, 'progress')}
                        color="emerald"
                        showHint={true}
                      />
                      {parseFloat(progress) >= 80 && parseFloat(progress) < 100 && (
                        <EncouragementMessage 
                          type="progress" 
                          className="mt-2"
                        />
                      )}
                    </div>

                    {goal.deadline && (
                      <div className="flex items-center gap-2 mb-4 text-sm">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className={daysRemaining && daysRemaining < 7 ? 'text-amber-400' : 'text-slate-400'}>
                          {daysRemaining !== null && daysRemaining >= 0
                            ? `${daysRemaining} days remaining`
                            : 'Deadline passed'}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        data-testid={`update-progress-${goal.id}`}
                        onClick={() => handleUpdateProgress(goal.id, goal.currentProgress + 1)}
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                      >
                        +1 Progress
                      </Button>
                      {goal.currentProgress < goal.targetValue && (
                        <Button
                          onClick={() => handleUpdateProgress(goal.id, goal.targetValue)}
                          size="sm"
                          variant="outline"
                          className="border-white/10 text-slate-300"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Completed Goals 🎉</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map(goal => (
                <div
                  key={goal.id}
                  data-testid={`completed-goal-${goal.id}`}
                  className="bg-bg-card backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {goal.title}
                      </h4>
                      <span className="text-xs text-slate-500">{goal.category}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Completed {formatDate(goal.deadline)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}