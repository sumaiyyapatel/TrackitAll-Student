export { 
  formatDate, 
  formatDateTime, 
  getCurrentDateISO, 
  calculateDaysRemaining,
  formatDuration
} from './dateHelper';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getAttendanceColor = (percentage) => {
  if (percentage >= 90) return 'text-emerald-400';
  if (percentage >= 80) return 'text-amber-400';
  return 'text-rose-400';
};

export const getAttendanceStatus = (percentage) => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Good';
  if (percentage >= 75) return 'Warning';
  return 'Critical';
};

export const calculateBMI = (weight, height) => {
  if (!weight || !height || height === 0) return 0;
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const getMoodEmoji = (mood) => {
  const emojiMap = {
    1: '😢', 2: '😔', 3: '😕', 4: '😐', 5: '🙂',
    6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳'
  };
  return emojiMap[mood] || '😐';
};

export const getMoodColor = (mood) => {
  if (mood >= 8) return 'bg-emerald-500';
  if (mood >= 6) return 'bg-cyan-500';
  if (mood >= 4) return 'bg-amber-500';
  return 'bg-rose-500';
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getGoalProgress = (current, target) => {
  if (!target || target === 0) return 0;
  return Math.min((current / target) * 100, 100).toFixed(1);
};