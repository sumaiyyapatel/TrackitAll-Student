import React from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ViewToggle - Switches between "Quick View" (summary) and "Detailed View"
 * 
 * @param {'quick' | 'detailed'} view - Current view mode
 * @param {function} onViewChange - Callback when view changes
 * @param {string} className - Additional classes
 */
export const ViewToggle = ({ view, onViewChange, className = '' }) => {
  return (
    <div className={cn(
      'inline-flex items-center rounded-xl bg-muted/50 border border-border p-1 gap-1',
      className
    )}>
      <button
        onClick={() => onViewChange('quick')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          view === 'quick'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Quick view"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Quick</span>
      </button>
      <button
        onClick={() => onViewChange('detailed')}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          view === 'detailed'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Detailed view"
      >
        <List className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Detailed</span>
      </button>
    </div>
  );
};
