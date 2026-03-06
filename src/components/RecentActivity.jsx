import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, Smile, BookOpen, Heart, Droplets, Activity } from 'lucide-react';
import { getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import useStore from '@/store/useStore';
import { CATEGORY_THEMES } from '@/utils/categoryColors';

const ACTIVITY_CONFIG = {
    attendance: {
        icon: Calendar,
        theme: CATEGORY_THEMES.attendance,
        getLabel: (d) => d.attended ? `Attended ${d.course || 'class'}` : `Missed ${d.course || 'class'}`
    },
    expenses: {
        icon: DollarSign,
        theme: CATEGORY_THEMES.finance,
        getLabel: (d) => `₹${d.amount} — ${d.category || d.description || 'Expense'}`
    },
    mood_entries: {
        icon: Smile,
        theme: CATEGORY_THEMES.mood,
        getLabel: (d) => `Mood: ${d.mood}/10${d.note ? ` — ${d.note}` : ''}`
    },
    study_sessions: {
        icon: BookOpen,
        theme: CATEGORY_THEMES.study,
        getLabel: (d) => `${d.subject || 'Study'} — ${d.duration || 0} min`
    },
    health: {
        icon: Heart,
        theme: CATEGORY_THEMES.health,
        getLabel: (d) => {
            if (d.type === 'workout') return `Workout — ${d.duration || 0} min`;
            if (d.type === 'sleep') return `Sleep — ${d.hours || 0}h`;
            if (d.type === 'meal') return `${d.intensity || 'Meal'} — ${d.calories || 0} kcal`;
            return 'Health entry';
        }
    },
    water_intake: {
        icon: Droplets,
        theme: { ...CATEGORY_THEMES.health, iconBg: 'bg-cyan-600', text: 'text-cyan-400' },
        getLabel: (d) => `Drank ${d.glasses || 1} glass${(d.glasses || 1) > 1 ? 'es' : ''} of water`
    }
};

const getRelativeTime = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const RecentActivity = () => {
    const { user } = useStore();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadRecentActivity();
    }, [user]);

    const loadRecentActivity = async () => {
        try {
            const collections = ['attendance', 'expenses', 'mood_entries', 'study_sessions', 'health', 'water_intake'];

            const results = await Promise.all(
                collections.map(async (col) => {
                    try {
                        const snap = await getDocs(userRecent(db, col, user.uid, 5));
                        return snap.docs.map(d => ({
                            id: d.id,
                            collection: col,
                            ...d.data()
                        }));
                    } catch {
                        return [];
                    }
                })
            );

            const merged = results.flat()
                .filter(item => item.date)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 8);

            setActivities(merged);
        } catch (err) {
            console.error('Error loading recent activity:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity yet. Start tracking!</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {activities.map((item, index) => {
                const config = ACTIVITY_CONFIG[item.collection];
                if (!config) return null;
                const Icon = config.icon;
                const theme = config.theme;

                return (
                    <div
                        key={`${item.collection}-${item.id}`}
                        className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all animate-slide-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className={`w-9 h-9 rounded-lg ${theme.iconBg} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{config.getLabel(item)}</p>
                            <p className="text-xs text-muted-foreground">{getRelativeTime(item.date)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
