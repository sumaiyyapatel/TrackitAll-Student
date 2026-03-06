import React from 'react';

/**
 * ActionCard - Clickable/interactive card
 * No color props, no shadows
 * Hover: border color change only
 * Padding: p-6 (enforced)
 */
export const ActionCard = ({ 
  children, 
  onClick, 
  className = '', 
  testId,
  as: Component = 'div'
}) => {
  const baseClasses = "bg-bg-card border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-all cursor-pointer";
  
  if (Component === 'div' && onClick) {
    return (
      <div
        data-testid={testId}
        onClick={onClick}
        className={`${baseClasses} ${className}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {children}
      </div>
    );
  }
  
  return (
    <Component
      data-testid={testId}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </Component>
  );
};

