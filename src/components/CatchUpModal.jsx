import React, { useState } from 'react';
import { Calendar, Droplets, Dumbbell, Smile, Loader2, Check } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import useStore from '@/store/useStore';
import { toast } from 'sonner';
import { POINTS } from '@/utils/gamification';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';

const MOOD_OPTIONS = [
    { value: 3, emoji: '😔' },
    { value: 5, emoji: '😐' },
    { value: 7, emoji: '😊' },
    { value: 9, emoji: '🤩' },
];

export const CatchUpModal = ({ isOpen, setIsOpen }) => {
    const { user, addPoints } = useStore();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Build last 7 days
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            days.push({
                date: d,
                key: d.toISOString().split('T')[0],
                label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short' }),
                dayNum: d.getDate(),
            });
        }
        return days;
    };

    const days = getLast7Days();

    // State for each day: { [dateKey]: { attendance: bool, water: bool, workout: bool, mood: number|null } }
    const [dayEntries, setDayEntries] = useState(() => {
        const initial = {};
        days.forEach(d => {
            initial[d.key] = { attendance: false, water: false, workout: false, mood: null };
        });
        return initial;
    });

    const toggleField = (dateKey, field) => {
        setDayEntries(prev => ({
            ...prev,
            [dateKey]: {
                ...prev[dateKey],
                [field]: !prev[dateKey][field]
            }
        }));
    };

    const setMood = (dateKey, moodVal) => {
        setDayEntries(prev => ({
            ...prev,
            [dateKey]: {
                ...prev[dateKey],
                mood: prev[dateKey].mood === moodVal ? null : moodVal
            }
        }));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        let totalEntries = 0;
        let totalXP = 0;

        try {
            for (const day of days) {
                const entry = dayEntries[day.key];
                const dateISO = day.date.toISOString();

                if (entry.attendance) {
                    await addDoc(collection(db, 'attendance'), {
                        attended: true,
                        date: dateISO,
                        userId: user.uid,
                        course: 'Catch-up'
                    });
                    totalEntries++;
                    totalXP += POINTS.MARK_ATTENDANCE;
                    addPoints(POINTS.MARK_ATTENDANCE);
                }

                if (entry.water) {
                    await addDoc(collection(db, 'water_intake'), {
                        glasses: 8,
                        date: dateISO,
                        userId: user.uid
                    });
                    totalEntries++;
                    totalXP += POINTS.DAILY_STREAK;
                    addPoints(POINTS.DAILY_STREAK);
                }

                if (entry.workout) {
                    await addDoc(collection(db, 'health'), {
                        type: 'workout',
                        duration: 30,
                        calories: 200,
                        intensity: 'medium',
                        description: 'Catch-up log',
                        date: dateISO,
                        userId: user.uid
                    });
                    totalEntries++;
                    totalXP += POINTS.LOG_HEALTH;
                    addPoints(POINTS.LOG_HEALTH);
                }

                if (entry.mood !== null) {
                    await addDoc(collection(db, 'mood_entries'), {
                        mood: entry.mood,
                        date: dateISO,
                        userId: user.uid,
                        note: 'Catch-up entry'
                    });
                    totalEntries++;
                    totalXP += POINTS.LOG_MOOD;
                    addPoints(POINTS.LOG_MOOD);
                }
            }

            if (totalEntries > 0) {
                toast.success(`🎉 Caught up! ${totalEntries} entries logged, +${totalXP} XP!`);
                setSaved(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setSaved(false);
                }, 1500);
            } else {
                toast.info('No entries selected');
            }
        } catch (err) {
            console.error('Catch-up error:', err);
            toast.error('Failed to save some entries');
        } finally {
            setSaving(false);
        }
    };

    const totalSelected = Object.values(dayEntries).reduce((acc, entry) => {
        return acc + (entry.attendance ? 1 : 0) + (entry.water ? 1 : 0) + (entry.workout ? 1 : 0) + (entry.mood !== null ? 1 : 0);
    }, 0);

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            title="Catch Up"
            description="Batch-log missed days — select what you did each day"
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {days.map((day) => {
                    const entry = dayEntries[day.key];
                    return (
                        <div key={day.key} className="bg-muted/20 rounded-xl p-4 space-y-3">
                            {/* Day Header */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                                    <span className="text-sm font-bold text-violet-400">{day.dayNum}</span>
                                </div>
                                <span className="text-sm font-semibold">{day.label}</span>
                            </div>

                            {/* Toggle buttons row */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => toggleField(day.key, 'attendance')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${entry.attendance
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    Attended
                                </button>

                                <button
                                    onClick={() => toggleField(day.key, 'water')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${entry.water
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    <Droplets className="w-3.5 h-3.5" />
                                    Water
                                </button>

                                <button
                                    onClick={() => toggleField(day.key, 'workout')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${entry.workout
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    <Dumbbell className="w-3.5 h-3.5" />
                                    Workout
                                </button>

                                {/* Mood quick-select */}
                                <div className="flex items-center gap-1 ml-auto">
                                    {MOOD_OPTIONS.map((m) => (
                                        <button
                                            key={m.value}
                                            onClick={() => setMood(day.key, m.value)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${entry.mood === m.value
                                                    ? 'bg-cyan-600 scale-110'
                                                    : 'bg-muted/40 hover:bg-muted/60'
                                                }`}
                                            title={`Mood: ${m.value}/10`}
                                        >
                                            {m.emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                    {totalSelected} {totalSelected === 1 ? 'entry' : 'entries'} selected
                </p>
                <Button
                    onClick={handleSaveAll}
                    disabled={saving || saved || totalSelected === 0}
                    className="bg-violet-600 hover:bg-violet-500 gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved!
                        </>
                    ) : (
                        'Save All'
                    )}
                </Button>
            </div>
        </ResponsiveDialog>
    );
};
