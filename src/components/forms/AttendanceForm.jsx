import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AttendanceForm = ({ courses, selectedCourse, setSelectedCourse, onSubmit, submitting }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label className="text-foreground">Select Course</Label>
        <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
          <SelectTrigger data-testid="course-select" className="bg-background border-border text-foreground">
            <SelectValue placeholder="Choose a course" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {courses.map(course => (
              <SelectItem key={course.id} value={course.id} className="text-foreground">
                {course.name} ({course.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-500">
        {submitting ? 'Marking...' : 'Mark Present'}
      </Button>
    </form>
  );
};
