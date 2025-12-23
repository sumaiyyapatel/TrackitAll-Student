import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'violet', testId }) => {
  const colorClasses = {
    violet: 'from-violet-600 to-violet-500',
    emerald: 'from-emerald-600 to-emerald-500',
    amber: 'from-amber-600 to-amber-500',
    rose: 'from-rose-600 to-rose-500',
    cyan: 'from-cyan-600 to-cyan-500',
    pink: 'from-pink-600 to-pink-500'
  };

  return (
    <div 
      data-testid={testId}
      className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</h3>
          </div>
          {Icon && (
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        
        {trend && (
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
            <span className={`text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendValue}
            </span>
            <span className="text-sm text-slate-500">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};