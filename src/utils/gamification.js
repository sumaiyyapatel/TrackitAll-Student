export const POINTS = {
  LOG_DATA: 10,
  COMPLETE_GOAL: 50,
  DAILY_STREAK: 5,
  WEEKLY_STREAK: 25,
  MONTHLY_STREAK: 100,
  FIRST_ENTRY: 20,
  MARK_ATTENDANCE: 5,
  LOG_EXPENSE: 3,
  LOG_MOOD: 5,
  LOG_HEALTH: 5
};

export const BADGES = [
  { id: 'first-entry', name: 'First Entry', description: 'Log your first data', icon: '🌟', condition: 'first_log' },
  { id: 'week-warrior', name: 'Week Warrior', description: 'Log daily for 7 days', icon: '💪', condition: 'streak_7' },
  { id: 'budget-master', name: 'Budget Master', description: 'Stay within budget for a month', icon: '💰', condition: 'budget_month' },
  { id: 'fitness-fanatic', name: 'Fitness Fanatic', description: 'Log 50 workouts', icon: '🏃', condition: 'workout_50' },
  { id: 'dream-saver', name: 'Dream Saver', description: 'Reach a savings goal', icon: '🎯', condition: 'savings_goal' },
  { id: 'mood-mentor', name: 'Mood Mentor', description: '7-day mood streak', icon: '😊', condition: 'mood_streak_7' },
  { id: 'goal-getter', name: 'Goal Getter', description: 'Complete 5 goals', icon: '✨', condition: 'goals_5' },
  { id: 'perfect-attendance', name: 'Perfect Attendance', description: '90%+ attendance in a course', icon: '📚', condition: 'attendance_90' },
  { id: 'health-hero', name: 'Health Hero', description: 'Track all health metrics for 30 days', icon: '❤️', condition: 'health_30' },
  { id: 'money-manager', name: 'Money Manager', description: 'Log 100 expenses', icon: '💳', condition: 'expense_100' }
];

export const calculateLevel = (points) => {
  return Math.min(Math.floor(points / 100) + 1, 50);
};

export const getNextLevelPoints = (currentPoints) => {
  const currentLevel = calculateLevel(currentPoints);
  return currentLevel * 100;
};

export const getLevelProgress = (points) => {
  const currentLevel = calculateLevel(points);
  const pointsInCurrentLevel = points - (currentLevel - 1) * 100;
  return (pointsInCurrentLevel / 100) * 100;
};

export const checkBadgeEligibility = (userActivity) => {
  const eligibleBadges = [];
  
  if (userActivity.totalLogs === 1) {
    eligibleBadges.push(BADGES.find(b => b.id === 'first-entry'));
  }
  
  if (userActivity.currentStreak >= 7) {
    eligibleBadges.push(BADGES.find(b => b.id === 'week-warrior'));
  }
  
  if (userActivity.workoutCount >= 50) {
    eligibleBadges.push(BADGES.find(b => b.id === 'fitness-fanatic'));
  }
  
  if (userActivity.goalsCompleted >= 5) {
    eligibleBadges.push(BADGES.find(b => b.id === 'goal-getter'));
  }
  
  if (userActivity.expenseCount >= 100) {
    eligibleBadges.push(BADGES.find(b => b.id === 'money-manager'));
  }
  
  return eligibleBadges.filter(Boolean);
};