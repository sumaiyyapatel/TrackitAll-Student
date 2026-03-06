import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeSlider } from '@/components/ui/TimeSlider';

export const HealthForm = ({
  newEntry,
  setNewEntry,
  onSubmit,
  submitting
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label className="text-slate-300">Entry Type</Label>
        <Select value={newEntry.type} onValueChange={(val) => setNewEntry({ ...newEntry, type: val })}>
          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10">
            <SelectItem value="workout">Workout</SelectItem>
            <SelectItem value="sleep">Sleep</SelectItem>
            <SelectItem value="meal">Meal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {newEntry.type === 'workout' && (
        <>
          <div>
            <Label className="text-slate-300 mb-2 block">Duration</Label>
            <TimeSlider
              value={parseInt(newEntry.duration) || 30}
              onChange={(val) => setNewEntry({ ...newEntry, duration: String(val) })}
              min={5}
              max={120}
              step={5}
              unit="min"
            />
          </div>
          <div>
            <Label className="text-slate-300">Calories</Label>
            <Input
              type="number"
              placeholder="300"
              value={newEntry.calories}
              onChange={e => setNewEntry({ ...newEntry, calories: e.target.value })}
              className="bg-slate-950 border-slate-800 text-slate-200"
              required
            />
          </div>
          <div>
            <Label className="text-slate-300">Description</Label>
            <Input
              placeholder="Morning Run, Gym Session..."
              value={newEntry.description}
              onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />
          </div>
        </>
      )}

      {newEntry.type === 'sleep' && (
        <>
          <div>
            <Label className="text-slate-300">Hours</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="7.5"
              value={newEntry.hours}
              onChange={e => setNewEntry({ ...newEntry, hours: e.target.value })}
              className="bg-slate-950 border-slate-800 text-slate-200"
              required
            />
          </div>
          <div>
            <Label className="text-slate-300">Quality (1-10)</Label>
            <Input
              type="number"
              min="1"
              max="10"
              placeholder="8"
              value={newEntry.quality}
              onChange={e => setNewEntry({ ...newEntry, quality: e.target.value })}
              className="bg-slate-950 border-slate-800 text-slate-200"
              required
            />
          </div>
        </>
      )}

      {newEntry.type === 'meal' && (
        <>
          <div>
            <Label className="text-slate-300">Meal Type</Label>
            <Select value={newEntry.intensity} onValueChange={(val) => setNewEntry({ ...newEntry, intensity: val })}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                <SelectValue placeholder="Select meal" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-300">Description</Label>
            <Input
              placeholder="Oatmeal, Chicken Salad..."
              value={newEntry.description}
              onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />
          </div>
          <div>
            <Label className="text-slate-300">Calories (approx)</Label>
            <Input
              type="number"
              placeholder="500"
              value={newEntry.calories}
              onChange={e => setNewEntry({ ...newEntry, calories: e.target.value })}
              className="bg-slate-950 border-slate-800 text-slate-200"
            />
          </div>
        </>
      )}

      <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-500">
        {submitting ? 'Saving...' : 'Save Entry'}
      </Button>
    </form>
  );
};
