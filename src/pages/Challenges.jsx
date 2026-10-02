import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Mascot } from '@/components/game/Mascot';
import { PageHeader } from '@/components/game/PageHeader';
import useStore from '@/store/useStore';
import useGameStore from '@/store/useGameStore';
import { Trophy, Plus, Users, Calendar, Flag, Award, Trash2, Edit2, X } from 'lucide-react';
import { db, collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy, deleteDoc } from '@/lib/localDb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { calculateDaysRemaining, formatDate } from '@/utils/helpers';
import { normalizeDate } from '@/utils/dateNormalizer';
import { DataCard } from '@/components/cards/DataCard';


const CHALLENGE_TYPES = [
  { value: 'fitness', label: '30-Day Fitness Challenge', description: 'Exercise every day for 30 days' },
  { value: 'savings', label: 'Savings Sprint', description: 'Save target amount in 2 weeks' },
  { value: 'study', label: 'Study Marathon', description: 'Study 2 hours daily for 14 days' },
  { value: 'attendance', label: 'Perfect Attendance', description: '100% attendance for a month' },
  { value: 'mood', label: 'Mood Tracker Challenge', description: 'Log mood daily for 21 days' }
];

export default function Challenges() {
  const { user } = useStore();
  const recordActivity = useGameStore(s => s.recordActivity);
  const [challenges, setChallenges] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    type: 'fitness',
    goal: '',
    duration: '30',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChallenges();
    }
  }, [user]);

  const toDate = normalizeDate;

  const loadChallenges = async () => {
    try {
      const challengesQuery = query(
        collection(db, 'challenges'),
        orderBy('startDate', 'desc')
      );
      const challengesSnap = await getDocs(challengesQuery);
      const challengesData = challengesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter challenges where user is participant or creator
      const myChallenges = challengesData.filter(challenge =>
        challenge.createdBy === user.uid ||
        (challenge.participants && challenge.participants[user.uid])
      );

      setChallenges(myChallenges);
    } catch (error) {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    try {
      const challengeType = CHALLENGE_TYPES.find(t => t.value === newChallenge.type);
      const endDate = new Date(newChallenge.startDate);
      endDate.setDate(endDate.getDate() + parseInt(newChallenge.duration));

      if (editingId) {
        await updateDoc(doc(db, 'challenges', editingId), {
          title: newChallenge.title || challengeType.label,
          type: newChallenge.type,
          description: challengeType.description,
          goal: newChallenge.goal,
          duration: parseInt(newChallenge.duration),
          startDate: newChallenge.startDate,
          endDate: endDate.toISOString()
        });
        toast.success('Challenge updated!');
      } else {
        await addDoc(collection(db, 'challenges'), {
          title: newChallenge.title || challengeType.label,
          type: newChallenge.type,
          description: challengeType.description,
          goal: newChallenge.goal,
          duration: parseInt(newChallenge.duration),
          startDate: newChallenge.startDate,
          endDate: endDate.toISOString(),
          createdBy: user.uid,
          createdByName: user.displayName,
          participants: {
            [user.uid]: {
              name: user.displayName,
              progress: 0,
              joined: new Date().toISOString()
            }
          },
          status: 'active',
          winner: null
        });
        recordActivity('challenge_create');
        toast.success('Challenge created!');
      }

      setShowCreate(false);
      setEditingId(null);
      setNewChallenge({ title: '', type: 'fitness', goal: '', duration: '30', startDate: new Date().toISOString().split('T')[0] });
      loadChallenges();
    } catch (error) {
      toast.error('Failed to save challenge');
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'challenges', challengeId));
      toast.success('Challenge deleted');
      loadChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error('Failed to delete challenge');
    }
  };

  const handleEditChallenge = (challenge) => {
    setEditingId(challenge.id);
    setNewChallenge({
      title: challenge.title,
      type: challenge.type,
      goal: challenge.goal,
      duration: challenge.duration.toString(),
      startDate: challenge.startDate ? new Date(challenge.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowCreate(true);
  };

  const handleCancel = () => {
    setShowCreate(false);
    setEditingId(null);
    setNewChallenge({ title: '', type: 'fitness', goal: '', duration: '30', startDate: new Date().toISOString().split('T')[0] });
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challenge = challenges.find(c => c.id === challengeId);

      await updateDoc(challengeRef, {
        [`participants.${user.uid}`]: {
          name: user.displayName,
          progress: 0,
          joined: new Date().toISOString()
        }
      });

      toast.success('Joined challenge!');
      loadChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast.error('Failed to join challenge');
    }
  };

  const handleUpdateProgress = async (challengeId, newProgress) => {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challenge = challenges.find(c => c.id === challengeId);
      const oldProgress = challenge.participants && challenge.participants[user.uid]?.progress || 0;
      const wasCompleted = oldProgress >= 100;
      const isNowCompleted = newProgress >= 100;

      await updateDoc(challengeRef, {
        [`participants.${user.uid}.progress`]: newProgress
      });

      if (isNowCompleted && !wasCompleted) {
        recordActivity('challenge_complete', { celebrate: { emoji: '🏆', title: 'Challenge complete!', body: `You conquered "${challenge.title}"!` } });
      } else if (newProgress >= 80 && newProgress < 100) {
        if (newProgress > oldProgress) recordActivity('challenge_progress');
        toast.success(getProgressHint(newProgress, 100, 'progress'));
      } else {
        if (newProgress > oldProgress) recordActivity('challenge_progress');
        toast.success('Progress updated!');
      }

      loadChallenges();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const activeChallenges = challenges.filter(c => {
    const end = toDate(c.endDate);
    return c.status === 'active' && end && end >= new Date();
  });
  const completedChallenges = challenges.filter(c => {
    const end = toDate(c.endDate);
    return c.status === 'completed' || (end && end < new Date());
  });

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader subtitle="Compete with friends and achieve your goals" />
          <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) handleCancel(); }}>
            <DialogTrigger asChild>
              <Button data-testid="create-challenge-button" className="bg-amber-600 hover:bg-amber-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">{editingId ? 'Edit Challenge' : 'Create New Challenge'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateChallenge} className="space-y-4">
                <div>
                  <Label className="text-foreground">Challenge Type</Label>
                  <Select value={newChallenge.type} onValueChange={(val) => setNewChallenge({ ...newChallenge, type: val })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {CHALLENGE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {CHALLENGE_TYPES.find(t => t.value === newChallenge.type)?.description}
                  </p>
                </div>
                <div>
                  <Label className="text-foreground">Custom Title (Optional)</Label>
                  <Input
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    placeholder="My Fitness Challenge"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Goal Target</Label>
                  <Input
                    value={newChallenge.goal}
                    onChange={(e) => setNewChallenge({ ...newChallenge, goal: e.target.value })}
                    required
                    placeholder="30 days of exercise"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Duration (days)</Label>
                  <Input
                    type="number"
                    value={newChallenge.duration}
                    onChange={(e) => setNewChallenge({ ...newChallenge, duration: e.target.value })}
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Start Date</Label>
                  <Input
                    type="date"
                    value={newChallenge.startDate}
                    onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })}
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500">
                    {editingId ? 'Update Challenge' : 'Create Challenge'}
                  </Button>
                  <Button type="button" onClick={handleCancel} variant="outline" className="flex-1 border-border">
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
            title="Active Challenges"
            value={activeChallenges.length}
            icon={Trophy}
          />
          <DataCard
            title="Completed"
            value={completedChallenges.length}
            icon={Award}
          />
          <DataCard
            title="Total Participants"
            value={challenges.reduce((sum, c) => sum + Object.keys(c.participants || {}).length, 0)}
            icon={Users}
          />
        </div>

        {/* Active Challenges */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Challenges</h2>
          {activeChallenges.length === 0 ? (
            <div className="duo-card p-12 text-center">
              <Mascot mood="think" size={96} className="mx-auto mb-4 block" />
              <h3 className="text-xl font-semibold mb-2 text-muted-foreground">No active challenges</h3>
              <p className="text-muted-foreground mb-6">Create a challenge to compete with friends</p>
              <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Challenge
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {activeChallenges.map(challenge => {
                const daysRemaining = calculateDaysRemaining(challenge.endDate);
                const myProgress = challenge.participants && challenge.participants[user.uid]?.progress || 0;
                const participantCount = Object.keys(challenge.participants || {}).length;

                return (
                  <div
                    key={challenge.id}
                    data-testid={`challenge-${challenge.id}`}
                    className="duo-card p-6 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold">
                            {challenge.title}
                          </h3>
                          {challenge.createdBy === user.uid && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditChallenge(challenge)}
                                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteChallenge(challenge.id)}
                                className="border-danger/50 text-danger hover:bg-danger/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium inline-block mt-2">
                          {challenge.type}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Goal:</span>
                        <span className="font-semibold">{challenge.goal}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Time remaining:</span>
                        <span className={`font-semibold ${daysRemaining <= 7 ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                          {daysRemaining} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Participants:</span>
                        <span className="font-semibold">{participantCount}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Your Progress</span>
                          <span className="font-semibold">{myProgress}%</span>
                        </div>
                        <Progress value={myProgress} />
                      </div>

                      {myProgress >= 80 && myProgress < 100 && (
                        <EncouragementMessage
                          type="progress"
                          className="mt-2"
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateProgress(challenge.id, Math.min(myProgress + 10, 100))}
                        className="flex-1 bg-amber-600 hover:bg-amber-500"
                      >
                        +10% Progress
                      </Button>
                      {myProgress < 100 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateProgress(challenge.id, 100)}
                          className="border-border"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Completed Challenges 🎉</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {completedChallenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="duo-card border-emerald-500/40 p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {challenge.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">{challenge.type}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Completed {formatDate(challenge.endDate)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}