import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { BookOpen, Plus, Clock, TrendingUp, GraduationCap, Target, Timer } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { calculateDaysRemaining, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';

export default function Study() {
  const { user, addPoints } = useStore();
  const [studySessions, setStudySessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [newSession, setNewSession] = useState({
    subject: '',
    duration: '',
    topic: '',
    difficulty: 'medium'
  });
  const [newExam, setNewExam] = useState({
    subject: '',
    date: '',
    syllabus: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    let interval;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => {
          if (prev <= 1) {
            setPomodoroActive(false);
            toast.success('Pomodoro session complete! Take a 5-minute break.');
            addPoints(POINTS.LOG_DATA);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroTime, addPoints]);

  const loadData = async () => {
    try {
      // Load study sessions
      const sessionsQuery = query(
        collection(db, 'study_sessions'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );
      const sessionsSnap = await getDocs(sessionsQuery);
      const sessionsData = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load exams
      const examsQuery = query(
        collection(db, 'exams'),
        where('userId', '==', user.uid),
        orderBy('date', 'asc')
      );
      const examsSnap = await getDocs(examsQuery);
      const examsData = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setStudySessions(sessionsData);
      setExams(examsData);
    } catch (error) {
      console.error('Error loading study data:', error);
      toast.error('Failed to load study data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'study_sessions'), {
        ...newSession,
        duration: parseInt(newSession.duration),
        date: new Date().toISOString(),
        userId: user.uid
      });
      addPoints(POINTS.LOG_DATA);
      toast.success(`+${POINTS.LOG_DATA} XP! Study session logged`);
      setShowAddSession(false);
      setNewSession({ subject: '', duration: '', topic: '', difficulty: 'medium' });
      loadData();
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Failed to log study session');
    }
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'exams'), {
        ...newExam,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      toast.success('Exam added!');
      setShowAddExam(false);
      setNewExam({ subject: '', date: '', syllabus: '' });
      loadData();
    } catch (error) {
      console.error('Error adding exam:', error);
      toast.error('Failed to add exam');
    }
  };

  const startPomodoro = () => {
    setPomodoroTime(25 * 60);
    setPomodoroActive(true);
    toast.success('Pomodoro started! Focus for 25 minutes.');
  };

  const pausePomodoro = () => {
    setPomodoroActive(false);
  };

  const resetPomodoro = () => {
    setPomodoroActive(false);
    setPomodoroTime(25 * 60);
  };

  const getWeeklyStudyTime = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return studySessions
      .filter(session => new Date(session.date) >= startOfWeek)
      .reduce((sum, session) => sum + (session.duration || 0), 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const weeklyStudyTime = getWeeklyStudyTime();
  const upcomingExams = exams.filter(exam => new Date(exam.date) >= new Date()).slice(0, 3);

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
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Study Tools</h1>
            <p className="text-slate-400">Track study sessions, manage exams, and stay focused</p>
          </div>
        </div>

        {/* Stats & Pomodoro */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pomodoro Timer */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Pomodoro Timer</h3>
            </div>
            <div className="text-center mb-6">
              <div className="text-6xl font-bold mb-4" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {formatTime(pomodoroTime)}
              </div>
              <div className="flex gap-2 justify-center">
                {!pomodoroActive ? (
                  <Button
                    data-testid="start-pomodoro"
                    onClick={startPomodoro}
                    className="bg-violet-600 hover:bg-violet-500"
                  >
                    Start Focus
                  </Button>
                ) : (
                  <Button
                    data-testid="pause-pomodoro"
                    onClick={pausePomodoro}
                    variant="outline"
                    className="border-white/10"
                  >
                    Pause
                  </Button>
                )}
                <Button
                  onClick={resetPomodoro}
                  variant="outline"
                  className="border-white/10"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Weekly Study Time */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">This Week</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {Math.round(weeklyStudyTime / 60)}h
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">study time</p>
          </div>

          {/* Total Sessions */}
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Sessions</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {studySessions.length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-white/5">
            <TabsTrigger value="sessions" data-testid="tab-sessions">Study Sessions</TabsTrigger>
            <TabsTrigger value="exams" data-testid="tab-exams">Upcoming Exams</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Study Sessions</h2>
              <Dialog open={showAddSession} onOpenChange={setShowAddSession}>
                <DialogTrigger asChild>
                  <Button data-testid="add-session-button" className="bg-violet-600 hover:bg-violet-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-slate-200">Log Study Session</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSession} className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Subject</Label>
                      <Input
                        data-testid="session-subject-input"
                        value={newSession.subject}
                        onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                        required
                        placeholder="Mathematics"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Topic</Label>
                      <Input
                        value={newSession.topic}
                        onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                        placeholder="Calculus - Derivatives"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={newSession.duration}
                        onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
                        required
                        placeholder="60"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500">
                      Log Session
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {studySessions.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
                <BookOpen className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-400">No study sessions yet</h3>
                <p className="text-slate-500 mb-6">Start logging your study time</p>
                <Button onClick={() => setShowAddSession(true)} className="bg-violet-600 hover:bg-violet-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Your First Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {studySessions.map(session => (
                  <div
                    key={session.id}
                    data-testid={`session-${session.id}`}
                    className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-lg mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {session.subject}
                        </h4>
                        {session.topic && <p className="text-sm text-slate-400 mb-2">{session.topic}</p>}
                        <p className="text-xs text-slate-500">{formatDate(session.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-violet-400">{session.duration}min</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exams">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Upcoming Exams</h2>
              <Dialog open={showAddExam} onOpenChange={setShowAddExam}>
                <DialogTrigger asChild>
                  <Button data-testid="add-exam-button" className="bg-amber-600 hover:bg-amber-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Exam
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-slate-200">Add Exam</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddExam} className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Subject</Label>
                      <Input
                        data-testid="exam-subject-input"
                        value={newExam.subject}
                        onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                        required
                        placeholder="Physics"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Exam Date</Label>
                      <Input
                        type="date"
                        value={newExam.date}
                        onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                        required
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Syllabus/Topics</Label>
                      <Input
                        value={newExam.syllabus}
                        onChange={(e) => setNewExam({ ...newExam, syllabus: e.target.value })}
                        placeholder="Chapters 1-5"
                        className="bg-slate-950 border-slate-800 text-slate-200"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500">
                      Add Exam
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {upcomingExams.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
                <GraduationCap className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-400">No upcoming exams</h3>
                <p className="text-slate-500 mb-6">Add your exam schedule</p>
                <Button onClick={() => setShowAddExam(true)} className="bg-amber-600 hover:bg-amber-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Exam
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingExams.map(exam => {
                  const daysRemaining = calculateDaysRemaining(exam.date);
                  return (
                    <div
                      key={exam.id}
                      data-testid={`exam-${exam.id}`}
                      className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-amber-500/30 transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {exam.subject}
                          </h4>
                          {exam.syllabus && <p className="text-xs text-slate-500">{exam.syllabus}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-xs text-slate-400">{formatDate(exam.date)}</span>
                        <span className={`text-sm font-bold ${
                          daysRemaining <= 7 ? 'text-rose-400' :
                          daysRemaining <= 14 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {daysRemaining} days
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}