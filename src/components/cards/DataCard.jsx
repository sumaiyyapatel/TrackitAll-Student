import React from 'react';

/**
 * DataCard - Displays data/stats with icon, title, and value
 * Supports optional category theming for distinct color coding
 * Hover: border color change only
 * Padding: p-6 (enforced)
 */
export const DataCard = ({ title, value, icon: Icon, testId, className = '', borderColor = 'border-white/10', iconBg = 'bg-violet-600' }) => {
  return (
    <div 
      data-testid={testId}
      className={`bg-bg-card border ${borderColor} rounded-2xl p-6 hover:border-violet-500/30 transition-all ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
          <h3 className="text-3xl font-bold font-outfit">{value}</h3>
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

