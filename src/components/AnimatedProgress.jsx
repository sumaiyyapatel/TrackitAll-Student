import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Zap } from 'lucide-react';

export const AnimatedProgress = ({ 
  value, 
  max = 100, 
  label, 
  hint, 
  showHint = true,
  color = 'violet',
  size = 'default'
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);

  useEffect(() => {
    // Animate progress bar
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, value);
      setAnimatedValue(current);

      if (step >= steps) {
        clearInterval(timer);
        // Show encouragement if progress is good
        if (value >= max * 0.8) {
          setShowEncouragement(true);
          setTimeout(() => setShowEncouragement(false), 3000);
        }
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, max]);

  const percentage = Math.round((animatedValue / max) * 100);
  const isNearComplete = percentage >= 80;
  const isComplete = percentage >= 100;

  const colorClasses = {
    violet: 'bg-[#8b5cf6]',
    emerald: 'bg-success',
    amber: 'bg-warning',
    cyan: 'bg-info',
    rose: 'bg-danger'
  };

  const getEncouragementMessage = () => {
    if (isComplete) return "🎉 Goal Achieved! You're unstoppable!";
    if (isNearComplete) return "🔥 Almost there! Keep pushing!";
    if (percentage >= 50) return "💪 Great progress! You're halfway there!";
    if (percentage >= 25) return "✨ Good start! Keep it up!";
    return "🚀 Every step counts! You've got this!";
  };

  const getHintMessage = () => {
    if (!hint) return null;
    if (isComplete) return `🎯 ${hint} - Goal completed!`;
    if (isNearComplete) return `⚡ ${hint} - Just ${max - animatedValue} more to go!`;
    return hint;
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <div className="flex items-center gap-2">
            {isNearComplete && !isComplete && (
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
            {isComplete && (
              <Target className="w-4 h-4 text-emerald-400 animate-bounce" />
            )}
            <span className={`text-sm font-bold ${
              isComplete ? 'text-emerald-400' : 
              isNearComplete ? 'text-amber-400' : 
              'text-foreground'
            }`}>
              {percentage}%
            </span>
          </div>
        </div>
      )}
      
      <div className="relative">
        <Progress 
          value={animatedValue} 
          className={`h-${size === 'large' ? '4' : '3'} transition-all duration-300`}
        />
        {/* Animated glow effect when near completion */}
        {isNearComplete && (
          <div 
            className={`absolute inset-0 ${colorClasses[color]} opacity-20 blur-md animate-pulse`}
            style={{ 
              width: `${percentage}%`,
              transition: 'width 0.3s ease-out'
            }}
          />
        )}
      </div>

      {showHint && getHintMessage() && (
        <p className={`text-xs transition-all ${
          isComplete ? 'text-emerald-400 font-semibold' :
          isNearComplete ? 'text-amber-400 font-medium' :
          'text-muted-foreground'
        }`}>
          {getHintMessage()}
        </p>
      )}

      {showEncouragement && (
        <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-fade-in">
          <p className="text-xs text-emerald-400 font-medium flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            {getEncouragementMessage()}
          </p>
        </div>
      )}
    </div>
  );
};

