import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, DollarSign, Activity, Brain } from 'lucide-react';
import { formatCurrency } from '@/utils/helpers';
import { normalizeDate } from '@/utils/dateNormalizer';

/**
 * Generates smart insight statements by comparing current vs previous period data.
 * e.g. "You've spent ₹4,500 this month, +15% vs last month"
 */
const generateInsights = (data, type) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const insights = [];

  if (type === 'finance') {
    const thisMonth = data.filter(e => {
      const d = normalizeDate(e.date);
      return d && d >= startOfThisMonth && (e.type === 'expense' || !e.type);
    });
    const lastMonth = data.filter(e => {
      const d = normalizeDate(e.date);
      return d && d >= startOfLastMonth && d < startOfThisMonth && (e.type === 'expense' || !e.type);
    });

    const thisMonthTotal = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);
    const lastMonthTotal = lastMonth.reduce((sum, e) => sum + (e.amount || 0), 0);

    if (lastMonthTotal > 0) {
      const pctChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(0);
      const direction = pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'flat';
      insights.push({
        icon: DollarSign,
        text: `You've spent ${formatCurrency(thisMonthTotal)} this month, ${pctChange > 0 ? '+' : ''}${pctChange}% vs last month`,
        trend: direction,
        severity: pctChange > 20 ? 'warning' : pctChange < -10 ? 'success' : 'neutral',
      });
    } else if (thisMonthTotal > 0) {
      insights.push({
        icon: DollarSign,
        text: `You've spent ${formatCurrency(thisMonthTotal)} this month`,
        trend: 'neutral',
        severity: 'neutral',
      });
    }

    // Category spike detection
    const categorySums = {};
    thisMonth.forEach(e => {
      categorySums[e.category] = (categorySums[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(categorySums).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > thisMonthTotal * 0.4) {
      insights.push({
        icon: AlertTriangle,
        text: `${topCategory[0]} makes up ${Math.round(topCategory[1] / thisMonthTotal * 100)}% of your spending`,
        trend: 'up',
        severity: 'warning',
      });
    }
  }

  if (type === 'health') {
    const thisWeekWorkouts = data.filter(e => {
      const d = normalizeDate(e.date);
      return d && d >= startOfThisWeek && e.type === 'workout';
    });
    const lastWeekWorkouts = data.filter(e => {
      const d = normalizeDate(e.date);
      return d && d >= startOfLastWeek && d < startOfThisWeek && e.type === 'workout';
    });

    insights.push({
      icon: Activity,
      text: `${thisWeekWorkouts.length} workout${thisWeekWorkouts.length !== 1 ? 's' : ''} this week${lastWeekWorkouts.length > 0 ? ` (${lastWeekWorkouts.length} last week)` : ''}`,
      trend: thisWeekWorkouts.length > lastWeekWorkouts.length ? 'up' : thisWeekWorkouts.length < lastWeekWorkouts.length ? 'down' : 'flat',
      severity: thisWeekWorkouts.length === 0 ? 'warning' : 'success',
    });

    // Detect no workouts in 2 weeks
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentWorkouts = data.filter(e => {
      const d = normalizeDate(e.date);
      return d && d >= twoWeeksAgo && e.type === 'workout';
    });
    if (recentWorkouts.length === 0 && data.some(e => e.type === 'workout')) {
      insights.push({
        icon: AlertTriangle,
        text: 'No workouts in the past 2 weeks — time to get moving!',
        trend: 'down',
        severity: 'danger',
      });
    }
  }

  if (type === 'mood') {
    const thisWeek = data.filter(e => {
      const d = normalizeDate(e.date);
      return d && d >= startOfThisWeek;
    });
    const lastWeek = data.filter(e => {
      const d = normalizeDate(e.date);
      return d && d >= startOfLastWeek && d < startOfThisWeek;
    });

    const thisAvg = thisWeek.length > 0 ? thisWeek.reduce((s, e) => s + (e.mood || 0), 0) / thisWeek.length : 0;
    const lastAvg = lastWeek.length > 0 ? lastWeek.reduce((s, e) => s + (e.mood || 0), 0) / lastWeek.length : 0;

    if (thisWeek.length > 0) {
      const diff = thisAvg - lastAvg;
      insights.push({
        icon: Brain,
        text: `Average mood this week: ${thisAvg.toFixed(1)}/10${lastWeek.length > 0 ? ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)} vs last week)` : ''}`,
        trend: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat',
        severity: thisAvg < 4 ? 'warning' : thisAvg > 7 ? 'success' : 'neutral',
      });
    }
  }

  return insights;
};

const TrendIcon = ({ trend, className = '' }) => {
  if (trend === 'up') return <TrendingUp className={`w-4 h-4 ${className}`} />;
  if (trend === 'down') return <TrendingDown className={`w-4 h-4 ${className}`} />;
  return <Minus className={`w-4 h-4 ${className}`} />;
};

const severityStyles = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  danger: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  neutral: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
};

const trendBadgeStyles = {
  up: 'bg-emerald-500/20 text-emerald-400',
  down: 'bg-rose-500/20 text-rose-400',
  flat: 'bg-slate-500/20 text-slate-400',
};

export const SmartInsights = ({ data = [], type = 'finance', className = '' }) => {
  const insights = useMemo(() => generateInsights(data, type), [data, type]);

  if (insights.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Smart insights">
      {insights.map((insight, idx) => {
        const Icon = insight.icon;
        return (
          <div
            key={idx}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all animate-fade-in ${severityStyles[insight.severity]}`}
            role="status"
            aria-live="polite"
          >
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium flex-1">{insight.text}</p>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${trendBadgeStyles[insight.trend]}`}
              aria-label={`Trend: ${insight.trend === 'up' ? 'increasing' : insight.trend === 'down' ? 'decreasing' : 'stable'}`}
            >
              <TrendIcon trend={insight.trend} />
              {insight.trend === 'up' ? '📈' : insight.trend === 'down' ? '📉' : '➡️'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export { generateInsights };
