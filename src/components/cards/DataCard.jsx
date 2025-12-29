import React from 'react';

/**
 * DataCard - Displays data/stats with icon, title, and value
 * No color props, no trends, no shadows
 * Hover: border color change only
 * Padding: p-6 (enforced)
 */
export const DataCard = ({ title, value, icon: Icon, testId, className = '' }) => {
  return (
    <div 
      data-testid={testId}
      className={`bg-bg-card border border-white/10 rounded-2xl p-6 hover:border-[#8b5cf6]/30 transition-all ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</h3>
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-[#8b5cf6] flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

