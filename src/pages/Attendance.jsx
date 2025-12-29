import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Calendar, Plus, Check, X, TrendingUp, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { normalizeDate } from '@/utils/dateNormalizer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', totalLectures: 40 });
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submittingAddCourse, setSubmittingAddCourse] = useState(false);
  const [submittingMark, setSubmittingMark] = useState(false);

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

      // Load attendance explicitly by userId to avoid relying on helpers
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', user.uid)
      );
      const attendanceSnap = await getDocs(attendanceQuery);
      const attendanceData = attendanceSnap.docs.map(doc => {
        const d = doc.data();
        return { id: doc.id, ...d, date: normalizeDate(d.date) };
      });

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
    if (submittingAddCourse) return;
    setSubmittingAddCourse(true);
    try {
      if (editingCourseId) {
        await updateDoc(doc(db, 'courses', editingCourseId), {
          name: newCourse.name,
          code: newCourse.code,
          totalLectures: newCourse.totalLectures
        });
        toast.success('Course updated successfully!');
      } else {
        await addDoc(collection(db, 'courses'), {
          ...newCourse,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        toast.success('Course added successfully!');
      }
      setShowAddCourse(false);
      setEditingCourseId(null);
      setNewCourse({ name: '', code: '', totalLectures: 40 });
      await loadData();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Failed to save course');
    } finally {
      setSubmittingAddCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? All attendance records will also be deleted.')) return;
    try {
      // Delete course
      await deleteDoc(doc(db, 'courses', courseId));
      // Delete related attendance records
      const attendanceToDelete = attendanceRecords.filter(r => r.courseId === courseId);
      await Promise.all(attendanceToDelete.map(r => deleteDoc(doc(db, 'attendance', r.id))));
      toast.success('Course deleted');
      await loadData();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleDeleteAttendance = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await deleteDoc(doc(db, 'attendance', recordId));
      toast.success('Attendance record deleted');
      await loadData();
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('Failed to delete attendance record');
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourseId(course.id);
    setNewCourse({
      name: course.name,
      code: course.code,
      totalLectures: course.totalLectures
    });
    setShowAddCourse(true);
  };

  const handleCancelCourse = () => {
    setShowAddCourse(false);
    setEditingCourseId(null);
    setNewCourse({ name: '', code: '', totalLectures: 40 });
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (submittingMark) return;
    setSubmittingMark(true);
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
      await loadData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setSubmittingMark(false);
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 bg-slate-800 rounded-2xl"><div className="h-6 bg-slate-700 rounded w-1/2 mb-3" /><div className="h-32 bg-slate-700 rounded" /></div>
            <div className="p-6 bg-slate-800 rounded-2xl"><div className="h-6 bg-slate-700 rounded w-1/2 mb-3" /><div className="h-32 bg-slate-700 rounded" /></div>
            <div className="p-6 bg-slate-800 rounded-2xl"><div className="h-6 bg-slate-700 rounded w-1/2 mb-3" /><div className="h-32 bg-slate-700 rounded" /></div>
          </div>
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
              <DialogContent className="bg-slate-900 border-white/10 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-200">Mark Attendance</DialogTitle>
                  <DialogDescription className="sr-only">
                    Record your attendance for today
                  </DialogDescription>
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
                  <Button type="submit" disabled={submittingMark} className="w-full bg-violet-600 hover:bg-violet-500">
                    {submittingMark ? 'Marking...' : 'Mark Present'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddCourse} onOpenChange={(open) => { setShowAddCourse(open); if (!open) handleCancelCourse(); }}>
              <DialogTrigger asChild>
                <Button data-testid="add-course-button" variant="outline" className="border-white/10 text-slate-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-slate-200">{editingCourseId ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {editingCourseId ? 'Edit course details' : 'Add a new course to track attendance'}
                  </DialogDescription>
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
                  <div className="flex gap-3">
                    <Button type="submit" disabled={submittingAddCourse} className="flex-1 bg-violet-600 hover:bg-violet-500">
                      {submittingAddCourse ? (editingCourseId ? 'Updating...' : 'Adding...') : (editingCourseId ? 'Update Course' : 'Add Course')}
                    </Button>
                    <Button type="button" onClick={handleCancelCourse} disabled={submittingAddCourse} variant="outline" className="flex-1 border-white/10">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
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
                  className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg mb-1 truncate" title={course.name} style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {course.name}
                          </h3>
                          <p className="text-sm text-slate-500">{course.code}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCourse(course)}
                            className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCourse(course.id)}
                            className="border-danger/50 text-danger hover:bg-danger/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
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

                    <div className="w-full bg-muted rounded-full h-2 relative overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          stats.percentage >= 90 ? 'bg-emerald-500' : 
                          stats.percentage >= 80 ? 'bg-amber-500' : 
                          'bg-danger'
                        } ${stats.percentage >= 90 ? 'animate-pulse-glow' : ''}`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                      {stats.percentage >= 90 && (
                        <div className="absolute inset-0 animate-shimmer" />
                      )}
                    </div>
                    {stats.percentage >= 90 && (
                      <p className="text-xs text-emerald-400 mt-1 font-medium animate-fade-in">
                        🎉 Excellent attendance! Keep it up!
                      </p>
                    )}
                    {stats.percentage >= 75 && stats.percentage < 90 && (
                      <p className="text-xs text-amber-400 mt-1 font-medium animate-fade-in">
                        💪 Good progress! Aim for 90%+
                      </p>
                    )}

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
                      <div className="mt-3 p-3 bg-bg-card rounded-lg">
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

        {/* Recent Attendance - responsive: cards on small screens, table on md+ */}
        {attendanceRecords.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Attendance</h2>

            {/* Small screens: stacked cards */}
            <div className="md:hidden space-y-3">
              {attendanceRecords.slice(0, 10).map(record => (
                <div key={record.id} data-testid={`attendance-record-${record.id}`} className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-start justify-between group">
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{record.courseName}</div>
                    <div className="text-xs text-slate-400">{formatDate(record.date)}</div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {record.attended ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                        <Check className="w-3 h-3" /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-danger/10 text-danger text-sm">
                        <X className="w-3 h-3" /> Absent
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteAttendance(record.id)}
                      className="p-1 text-slate-500 hover:text-danger hover:bg-danger/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Medium+ screens: table */}
            <div className="hidden md:block">
              <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-bg-card">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Course</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {attendanceRecords.slice(0, 10).map(record => (
                        <tr key={record.id} data-testid={`attendance-record-${record.id}`} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 text-sm">{record.courseName}</td>
                          <td className="px-6 py-4 text-sm text-slate-400">{formatDate(record.date)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {record.attended ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                                  <Check className="w-3 h-3" /> Present
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-danger/10 text-danger text-sm">
                                  <X className="w-3 h-3" /> Absent
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteAttendance(record.id)}
                                className="p-1 text-slate-500 hover:text-danger hover:bg-danger/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}