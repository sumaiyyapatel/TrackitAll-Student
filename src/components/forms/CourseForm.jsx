import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

export const CourseForm = ({ 
  newCourse, 
  setNewCourse, 
  onSubmit, 
  onCancel, 
  submitting, 
  isEditing 
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          onChange={(e) => setNewCourse({ ...newCourse, totalLectures: parseInt(e.target.value) || 0 })}
          required
          className="bg-slate-950 border-slate-800 text-slate-200"
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="flex-1 bg-violet-600 hover:bg-violet-500">
          {submitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Course' : 'Add Course')}
        </Button>
        <Button type="button" onClick={onCancel} disabled={submitting} variant="outline" className="flex-1 border-white/10">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
};
