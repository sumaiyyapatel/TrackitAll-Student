import React from 'react';

/**
 * ListItemCard - For list items
 * No color props, no shadows
 * Hover: border color change only
 * Padding: p-6 (enforced)
 */
export const ListItemCard = ({ 
  children, 
  className = '', 
  testId,
  onClick
}) => {
  const baseClasses = "bg-bg-card border border-white/10 rounded-2xl p-6 hover:border-[#8b5cf6]/30 transition-all";
  
  if (onClick) {
    return (
      <div
        data-testid={testId}
        onClick={onClick}
        className={`${baseClasses} cursor-pointer ${className}`}
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
    <div
      data-testid={testId}
      className={`${baseClasses} ${className}`}
    >
      {children}
    </div>
  );
};

