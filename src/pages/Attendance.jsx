import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ViewToggle } from '@/components/ViewToggle';
import { SectionHeader } from '@/components/SectionHeader';
import useStore from '@/store/useStore';
import { Calendar, Plus, Check, X, Edit2, Trash2 } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { normalizeDate } from '@/utils/dateNormalizer';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { AttendanceForm } from '@/components/forms/AttendanceForm';
import { CourseForm } from '@/components/forms/CourseForm';
import { toast } from 'sonner';
import { getAttendanceColor, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';
import { CATEGORY_THEMES } from '@/utils/categoryColors';

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
  const [courseView, setCourseView] = useState('quick');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const coursesQuery = query(
        collection(db, 'courses'),
        where('userId', '==', user.uid)
      );
      const coursesSnap = await getDocs(coursesQuery);
      const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
      await deleteDoc(doc(db, 'courses', courseId));
      const attendanceToDelete = attendanceRecords.filter(r => r.courseId === courseId);
      await Promise.all(attendanceToDelete.map(r => deleteDoc(doc(db, 'attendance', r.id))));
      toast.success('Course deleted');
      await loadData();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
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
    const total = courses.find(c => c.id === courseId)?.totalLectures || 40;
    const percentage = Math.round((attended / total) * 100);
    return { attended, total, percentage };
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="h-32 bg-card/50 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-card/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-container mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <SectionHeader
            title="Attendance Tracker"
            subtitle="Track your class attendance and maintain consistency"
            level="page"
            className="mb-0"
          />
          <div className="flex gap-3">
            <ResponsiveDialog
              isOpen={showMarkAttendance}
              setIsOpen={setShowMarkAttendance}
              title="Mark Attendance"
              description="Record your attendance for today"
              trigger={
                <Button
                  data-testid="mark-attendance-button"
                  className="bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              }
            >
              <AttendanceForm
                courses={courses}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                onSubmit={handleMarkAttendance}
                submitting={submittingMark}
              />
            </ResponsiveDialog>

            <ResponsiveDialog
              isOpen={showAddCourse}
              setIsOpen={(open) => { setShowAddCourse(open); if (!open) handleCancelCourse(); }}
              title={editingCourseId ? 'Edit Course' : 'Add New Course'}
              description={editingCourseId ? 'Edit course details' : 'Add a new course to track attendance'}
              trigger={
                <Button data-testid="add-course-button" variant="outline" className="border-white/10 text-slate-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              }
            >
              <CourseForm
                newCourse={newCourse}
                setNewCourse={setNewCourse}
                onSubmit={handleAddCourse}
                onCancel={handleCancelCourse}
                submitting={submittingAddCourse}
                isEditing={!!editingCourseId}
              />
            </ResponsiveDialog>
          </div>
        </div>

        {/* Sticky Summary */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-overline uppercase tracking-widest text-muted-foreground font-semibold">Overall Attendance</p>
                <h3 className={CATEGORY_THEMES.attendance.text}>
                  {courses.length > 0 
                    ? Math.round(courses.reduce((acc, c) => acc + getCourseStats(c.id).percentage, 0) / courses.length)
                    : 0}%
                </h3>
              </div>
              <div>
                <p className="text-overline uppercase tracking-widest text-muted-foreground font-semibold">Courses Tracked</p>
                <h3>{courses.length}</h3>
              </div>
            </div>
            <ViewToggle view={courseView} onViewChange={setCourseView} />
          </div>
        </div>

        {/* Course List */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-slate-400">No courses added yet</h3>
            <p className="text-slate-500 mb-6">Add your first course to start tracking attendance</p>
            <Button onClick={() => setShowAddCourse(true)} className="bg-violet-600 hover:bg-violet-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Course
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {courses.map(course => {
              const stats = getCourseStats(course.id);
              const target = 75;
              const requiredToTarget = Math.max(0, Math.ceil((target * course.totalLectures / 100) - stats.attended));
              
              return courseView === 'quick' ? (
                /* Quick View - Compact summary card */
                <div
                  key={course.id}
                  data-testid={`course-${course.id}`}
                  className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.attendance.border} rounded-2xl p-6 ${CATEGORY_THEMES.attendance.hoverBorder} transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-14 h-14 rounded-xl ${CATEGORY_THEMES.attendance.bg} flex items-center justify-center shrink-0`}>
                        <span className={`text-2xl font-bold ${getAttendanceColor(stats.percentage)}`}>{stats.percentage}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {course.name}
                        </h3>
                        <p className="text-body-sm text-muted-foreground">
                          {stats.attended}/{course.totalLectures} classes
                          {requiredToTarget > 0 && (
                            <span className="ml-2 text-caption">• Need {requiredToTarget} more for {target}%</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)} className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.id)} className="border-danger/50 text-danger hover:bg-danger/10">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {/* Compact progress bar */}
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${getAttendanceColor(stats.percentage).replace('text-', 'bg-')}`}
                        style={{ width: `${Math.min(100, stats.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Detailed View - Full course card with timeline */
                <CollapsibleSection
                  key={course.id}
                  title={course.name}
                  icon={Calendar}
                  summary={`${stats.percentage}% attendance • ${stats.attended}/${course.totalLectures} classes`}
                  badge={`${stats.percentage}%`}
                  borderColor={CATEGORY_THEMES.attendance.border}
                  defaultOpen={false}
                >
                  <div data-testid={`course-${course.id}`} className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-body-sm text-muted-foreground">{course.code}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCourse(course)} className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10">
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteCourse(course.id)} className="border-danger/50 text-danger hover:bg-danger/10">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${getAttendanceColor(stats.percentage).replace('text-', 'bg-')}`}
                              style={{ width: `${Math.min(100, stats.percentage)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-body-sm text-muted-foreground">
                              <span className="font-bold text-foreground">{stats.attended}</span> / {course.totalLectures} classes
                            </p>
                            <p className="text-body-sm font-medium">
                              {requiredToTarget > 0 
                                ? `Need ${requiredToTarget} more classes for ${target}%`
                                : `Target ${target}% reached!`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={`text-4xl font-bold ${getAttendanceColor(stats.percentage)}`}>
                        {stats.percentage}%
                      </div>
                    </div>

                    {/* Horizontal Timeline */}
                    <div className="pt-4 border-t border-border overflow-x-auto">
                      <div className="flex gap-2 min-w-max pb-2">
                        {attendanceRecords
                          .filter(r => r.courseId === course.id)
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .slice(0, 20)
                          .map(record => (
                            <div 
                              key={record.id}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                record.attended ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                              title={formatDate(record.date)}
                            >
                              {record.attended ? 'P' : 'A'}
                            </div>
                          ))}
                        {attendanceRecords.filter(r => r.courseId === course.id).length === 0 && (
                          <p className="text-body-sm text-muted-foreground">No records yet</p>
                        )}
                      </div>
                      <p className="text-overline text-muted-foreground uppercase tracking-widest mt-2">Recent Attendance Timeline</p>
                    </div>
                  </div>
                </CollapsibleSection>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
