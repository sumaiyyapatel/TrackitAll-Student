import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Calendar, Plus, Check, X, TrendingUp, AlertCircle } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getAttendanceColor, getAttendanceStatus, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';

export default function Attendance() {
  const { user, addPoints } = useStore();
  const [courses, setCourses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', totalLectures: 40 });
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('userId', '==', user.uid)
      );
      const coursesSnap = await getDocs(coursesQuery);
      const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load attendance (canonical query + JS filtering if needed)
      const attendanceSnap = await getDocs(userRecent(db, 'attendance', user.uid, 500));
      const attendanceData = attendanceSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setCourses(coursesData);
      setAttendanceRecords(attendanceData);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'courses'), {
        ...newCourse,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });
      toast.success('Course added successfully!');
      setShowAddCourse(false);
      setNewCourse({ name: '', code: '', totalLectures: 40 });
      loadData();
    } catch (error) {
      console.error('Error adding course:', error);
      toast.error('Failed to add course');
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'attendance'), {
        courseId: selectedCourse,
        courseName: courses.find(c => c.id === selectedCourse)?.name,
        attended: true,
        date: new Date().toISOString(),
        userId: user.uid
      });
      addPoints(POINTS.MARK_ATTENDANCE);
      toast.success(`+${POINTS.MARK_ATTENDANCE} XP! Attendance marked`);
      setShowMarkAttendance(false);
      setSelectedCourse('');
      loadData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    }
  };

  const getCourseStats = (courseId) => {
    const courseAttendance = attendanceRecords.filter(record => record.courseId === courseId);
    const attended = courseAttendance.filter(record => record.attended).length;
    const total = courseAttendance.length || 1;
    const percentage = Math.round((attended / total) * 100);
    return { attended, total, percentage };
  };

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
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Attendance Tracker</h1>
            <p className="text-slate-400">Track your class attendance and maintain consistency</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showMarkAttendance} onOpenChange={setShowMarkAttendance}>
              <DialogTrigger asChild>
                <Button
                  data-testid="mark-attendance-button"
                  className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-slate-200">Mark Attendance</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMarkAttendance} className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Select Course</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
                      <SelectTrigger data-testid="course-select" className="bg-slate-950 border-slate-800 text-slate-200">
                        <SelectValue placeholder="Choose a course" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id} className="text-slate-200">
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500">
                    Mark Present
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
              <DialogTrigger asChild>
                <Button data-testid="add-course-button" variant="outline" className="border-white/10 text-slate-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-slate-200">Add New Course</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Course Name</Label>
                    <Input
                      data-testid="course-name-input"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      required
                      placeholder="Data Structures"
                      className="bg-slate-950 border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Course Code</Label>
                    <Input
                      data-testid="course-code-input"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                      required
                      placeholder="CS201"
                      className="bg-slate-950 border-slate-800 text-slate-200"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Total Lectures (Expected)</Label>
                    <Input
                      data-testid="total-lectures-input"
                      type="number"
                      value={newCourse.totalLectures}
                      onChange={(e) => setNewCourse({ ...newCourse, totalLectures: parseInt(e.target.value) })}
                      required
                      className="bg-slate-950 border-slate-800 text-slate-200"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500">
                    Add Course
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-400">No courses added yet</h3>
            <p className="text-slate-500 mb-6">Add your first course to start tracking attendance</p>
            <Button onClick={() => setShowAddCourse(true)} className="bg-violet-600 hover:bg-violet-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Course
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const stats = getCourseStats(course.id);
              return (
                <div
                  key={course.id}
                  data-testid={`course-${course.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {course.name}
                      </h3>
                      <p className="text-sm text-slate-500">{course.code}</p>
                    </div>
                    <div className={`text-3xl font-bold ${getAttendanceColor(stats.percentage)}`}>
                      {stats.percentage}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Attended</span>
                      <span className="font-semibold">{stats.attended} / {stats.total}</span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${stats.percentage >= 90 ? 'bg-emerald-500' : stats.percentage >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {stats.percentage >= 90 ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : stats.percentage >= 75 ? (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <X className="w-4 h-4 text-rose-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        stats.percentage >= 90 ? 'text-emerald-400' :
                        stats.percentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {getAttendanceStatus(stats.percentage)}
                      </span>
                    </div>

                    {stats.percentage < 90 && (
                      <div className="mt-3 p-3 bg-slate-950/50 rounded-lg">
                        <p className="text-xs text-slate-400">
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          Attend {Math.ceil((90 * stats.total - 100 * stats.attended) / 10)} more lectures to reach 90%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Attendance */}
        {attendanceRecords.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Attendance</h2>
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-950/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Course</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendanceRecords.slice(0, 10).map(record => (
                      <tr key={record.id} data-testid={`attendance-record-${record.id}`} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm">{record.courseName}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{formatDate(record.date)}</td>
                        <td className="px-6 py-4">
                          {record.attended ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                              <Check className="w-3 h-3" /> Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-sm">
                              <X className="w-3 h-3" /> Absent
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}