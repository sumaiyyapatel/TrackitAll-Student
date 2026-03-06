import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '@/store/useStore';
import { Flame, Star, Trophy, Zap, X } from 'lucide-react';
import { AnimatedProgress } from '@/components/AnimatedProgress';
import { getProgressHint } from '@/components/EncouragementMessage';

/**
 * Prominent XP progress bar with animated milestone notifications.
 * Shows "🎉 Level 5!", "🔥 7-Day Streak!" etc.
 */
export const XPProgressBar = ({ className = '' }) => {
  const { userStats } = useStore();
  const points = userStats.points || 0;
  const level = userStats.level || 1;
  const pointsInLevel = points % 100;
  const pointsToNext = 100 - pointsInLevel;

  return (
    <div
      className={`bg-gradient-to-r from-violet-600/20 to-pink-600/20 border border-violet-500/30 rounded-2xl p-4 ${className}`}
      role="region"
      aria-label="XP Progress"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold">Level {level}</p>
            <p className="text-xs text-muted-foreground">{points} XP total</p>
          </div>
        </div>
        <span className="text-xs text-violet-400 font-medium">{pointsToNext} XP to Level {level + 1}</span>
      </div>
      <AnimatedProgress
        value={pointsInLevel}
        max={100}
        hint={getProgressHint(pointsInLevel, 100, 'milestone')}
        color="violet"
        size="large"
      />
    </div>
  );
};

/**
 * Animated milestone toast that floats in from bottom.
 */
export const MilestoneNotification = ({ milestone, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(), 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-violet-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-violet-500/30 flex items-center gap-4 max-w-sm"
      role="alert"
      aria-live="assertive"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: 2 }}
        className="text-3xl"
      >
        {milestone.icon}
      </motion.div>
      <div className="flex-1">
        <p className="font-bold text-sm">{milestone.title}</p>
        <p className="text-xs text-white/80">{milestone.description}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

/**
 * Hook to manage milestone notifications.
 * Monitors level changes and streak milestones.
 */
export const useMilestoneNotifications = () => {
  const { userStats } = useStore();
  const [milestones, setMilestones] = useState([]);
  const [prevLevel, setPrevLevel] = useState(userStats.level);
  const [prevPoints, setPrevPoints] = useState(userStats.points);

  useEffect(() => {
    const newMilestones = [];

    // Level up
    if (userStats.level > prevLevel && prevLevel > 0) {
      newMilestones.push({
        id: `level-${userStats.level}`,
        icon: '🎉',
        title: `Level ${userStats.level}!`,
        description: 'Keep up the amazing work!',
      });
    }

    // Streak milestones
    const streakValues = Object.values(userStats.streaks || {});
    const maxStreak = Math.max(...streakValues, 0);
    const prevStreakValues = [prevLevel]; // simplified check
    if (maxStreak === 7 && prevPoints < userStats.points) {
      newMilestones.push({
        id: `streak-7`,
        icon: '🔥',
        title: '7-Day Streak!',
        description: "You're on fire! A whole week of consistency!",
      });
    }
    if (maxStreak === 30 && prevPoints < userStats.points) {
      newMilestones.push({
        id: `streak-30`,
        icon: '💫',
        title: '30-Day Streak!',
        description: 'A whole month of dedication. Incredible!',
      });
    }

    // Points milestones (every 100)
    const prevHundred = Math.floor(prevPoints / 100);
    const newHundred = Math.floor(userStats.points / 100);
    if (newHundred > prevHundred && prevPoints > 0) {
      newMilestones.push({
        id: `points-${newHundred * 100}`,
        icon: '⭐',
        title: `${newHundred * 100} XP Reached!`,
        description: 'Your dedication is paying off!',
      });
    }

    if (newMilestones.length > 0) {
      setMilestones(prev => [...prev, ...newMilestones]);
    }

    setPrevLevel(userStats.level);
    setPrevPoints(userStats.points);
  }, [userStats.level, userStats.points, userStats.streaks]);

  const dismissMilestone = useCallback((id) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  }, []);

  return { milestones, dismissMilestone };
};

/**
 * Milestone notification container. Place once in app layout.
 */
export const MilestoneContainer = () => {
  const { milestones, dismissMilestone } = useMilestoneNotifications();

  return (
    <AnimatePresence>
      {milestones.slice(0, 1).map(milestone => (
        <MilestoneNotification
          key={milestone.id}
          milestone={milestone}
          onDismiss={() => dismissMilestone(milestone.id)}
        />
      ))}
    </AnimatePresence>
  );
};
