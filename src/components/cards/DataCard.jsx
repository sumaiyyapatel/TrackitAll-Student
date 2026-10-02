import React from 'react';
import { motion } from 'framer-motion';

/**
 * DataCard - Displays a stat with icon, title, and value
 * Supports optional category theming for distinct color coding
 */
export const DataCard = ({ title, value, icon: Icon, testId, className = '', borderColor = 'border-border', iconBg = 'bg-primary' }) => {
  return (
    <motion.div
      data-testid={testId}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className={`bg-card border-2 ${borderColor} rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
          <h3 className="truncate text-3xl font-black">{value}</h3>
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] ${iconBg}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
