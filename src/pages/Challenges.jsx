import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Trophy, Plus, Users, Calendar, Flag, Award } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { calculateDaysRemaining, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';

const CHALLENGE_TYPES = [
  { value: 'fitness', label: '30-Day Fitness Challenge', description: 'Exercise every day for 30 days' },
  { value: 'savings', label: 'Savings Sprint', description: 'Save target amount in 2 weeks' },
  { value: 'study', label: 'Study Marathon', description: 'Study 2 hours daily for 14 days' },
  { value: 'attendance', label: 'Perfect Attendance', description: '100% attendance for a month' },
  { value: 'mood', label: 'Mood Tracker Challenge', description: 'Log mood daily for 21 days' }
];

export default function Challenges() {
  const { user, addPoints } = useStore();
  const [challenges, setChallenges] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
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
      
      toast.success('Challenge created!');
      setShowCreate(false);
      setNewChallenge({ title: '', type: 'fitness', goal: '', duration: '30', startDate: new Date().toISOString().split('T')[0] });
      loadChallenges();
    } catch (error) {
      toast.error('Failed to create challenge');
    }
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
      
      await updateDoc(challengeRef, {
        [`participants.${user.uid}.progress`]: newProgress
      });

      if (newProgress >= 100) {
        addPoints(POINTS.COMPLETE_GOAL);
        toast.success(`+${POINTS.COMPLETE_GOAL} XP! Challenge completed! 🏆`);
      } else {
        toast.success('Progress updated!');
      }
      
      loadChallenges();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const activeChallenges = challenges.filter(c => c.status === 'active' && new Date(c.endDate) >= new Date());
  const completedChallenges = challenges.filter(c => c.status === 'completed' || new Date(c.endDate) < new Date());

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
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Challenges 🏆</h1>
            <p className="text-slate-400">Compete with friends and achieve your goals</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button data-testid="create-challenge-button" className="bg-amber-600 hover:bg-amber-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Create New Challenge</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateChallenge} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Challenge Type</Label>
                  <Select value={newChallenge.type} onValueChange={(val) => setNewChallenge({ ...newChallenge, type: val })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {CHALLENGE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    {CHALLENGE_TYPES.find(t => t.value === newChallenge.type)?.description}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">Custom Title (Optional)</Label>
                  <Input
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    placeholder="My Fitness Challenge"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Goal Target</Label>
                  <Input
                    value={newChallenge.goal}
                    onChange={(e) => setNewChallenge({ ...newChallenge, goal: e.target.value })}
                    required
                    placeholder="30 days of exercise"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Duration (days)</Label>
                  <Input
                    type="number"
                    value={newChallenge.duration}
                    onChange={(e) => setNewChallenge({ ...newChallenge, duration: e.target.value })}
                    required
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Start Date</Label>
                  <Input
                    type="date"
                    value={newChallenge.startDate}
                    onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })}
                    required
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500">
                  Create Challenge
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
                <p className="text-sm text-slate-400 mb-1">Active Challenges</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{activeChallenges.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Completed</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{completedChallenges.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Participants</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {challenges.reduce((sum, c) => sum + Object.keys(c.participants || {}).length, 0)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Challenges */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Active Challenges</h2>
          {activeChallenges.length === 0 ? (
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No active challenges</h3>
              <p className="text-slate-500 mb-6">Create a challenge to compete with friends</p>
              <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Challenge
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeChallenges.map(challenge => {
                const daysRemaining = calculateDaysRemaining(challenge.endDate);
                const myProgress = challenge.participants && challenge.participants[user.uid]?.progress || 0;
                const participantCount = Object.keys(challenge.participants || {}).length;
                
                return (
                  <div
                    key={challenge.id}
                    data-testid={`challenge-${challenge.id}`}
                    className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-slate-400">{challenge.description}</p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                        {challenge.type}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Goal:</span>
                        <span className="font-semibold">{challenge.goal}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Time remaining:</span>
                        <span className={`font-semibold ${
                          daysRemaining <= 7 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {daysRemaining} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Participants:</span>
                        <span className="font-semibold">{participantCount}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Your Progress</span>
                        <span className="text-sm font-bold">{myProgress}%</span>
                      </div>
                      <Progress value={myProgress} className="h-3" />
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
                          className="border-white/10"
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
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Completed Challenges 🎉</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {completedChallenges.map(challenge => (
                <div
                  key={challenge.id}
                  className="bg-slate-900/50 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {challenge.title}
                      </h4>
                      <p className="text-xs text-slate-500">{challenge.type}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">Completed {formatDate(challenge.endDate)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}