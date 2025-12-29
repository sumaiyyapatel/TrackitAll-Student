import React from 'react';
import { Sparkles, TrendingUp, Flame, Target, Star } from 'lucide-react';

const ENCOURAGEMENT_MESSAGES = {
  streak: [
    { icon: Flame, text: "🔥 Amazing streak! You're on fire!", color: 'amber' },
    { icon: Star, text: "⭐ Keep it going! Consistency is key!", color: 'violet' },
    { icon: TrendingUp, text: "📈 Your dedication is paying off!", color: 'emerald' }
  ],
  progress: [
    { icon: Target, text: "🎯 Great progress! You're getting closer!", color: 'emerald' },
    { icon: TrendingUp, text: "📊 Every step forward counts!", color: 'cyan' },
    { icon: Sparkles, text: "✨ You're doing amazing! Keep pushing!", color: 'violet' }
  ],
  achievement: [
    { icon: Star, text: "🌟 Achievement unlocked! You're a star!", color: 'amber' },
    { icon: Target, text: "🏆 Goal completed! You're unstoppable!", color: 'emerald' },
    { icon: Sparkles, text: "💫 Incredible work! Keep up the momentum!", color: 'violet' }
  ],
  milestone: [
    { icon: Flame, text: "🔥 Milestone reached! You're incredible!", color: 'rose' },
    { icon: Star, text: "⭐ Outstanding achievement! Well done!", color: 'amber' },
    { icon: TrendingUp, text: "📈 You're reaching new heights!", color: 'emerald' }
  ]
};

export const EncouragementMessage = ({ 
  type = 'progress', 
  customMessage,
  show = true,
  className = ''
}) => {
  if (!show) return null;

  const messages = ENCOURAGEMENT_MESSAGES[type] || ENCOURAGEMENT_MESSAGES.progress;
  const message = customMessage || messages[Math.floor(Math.random() * messages.length)];
  const Icon = message.icon;

  const colorClasses = {
    amber: 'bg-warning/10 border-warning/30 text-warning',
    violet: 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30 text-[#8b5cf6]',
    emerald: 'bg-success/10 border-success/30 text-success',
    cyan: 'bg-info/10 border-info/30 text-info',
    rose: 'bg-danger/10 border-danger/30 text-danger'
  };

  return (
    <div className={`p-3 rounded-xl border ${colorClasses[message.color]} animate-fade-in ${className}`}>
      <p className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4 animate-pulse" />
        {message.text}
      </p>
    </div>
  );
};

export const getProgressHint = (current, target, type = 'general') => {
  const percentage = (current / target) * 100;
  const remaining = target - current;

  if (percentage >= 100) {
    return "🎉 Goal achieved! Time to set a new challenge!";
  }
  
  if (percentage >= 90) {
    return `🔥 Almost there! Just ${remaining} more to reach your goal!`;
  }
  
  if (percentage >= 75) {
    return `💪 Great progress! ${remaining} more and you'll reach your target!`;
  }
  
  if (percentage >= 50) {
    return `✨ You're halfway there! Keep pushing forward!`;
  }
  
  if (percentage >= 25) {
    return `🚀 Good start! Every step counts towards your goal!`;
  }
  
  return `🌟 Beginning your journey! You've got this!`;
};

