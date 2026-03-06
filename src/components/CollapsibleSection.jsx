import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * CollapsibleSection - Progressive disclosure component
 * Shows a summary header that expands to reveal detailed content.
 * 
 * @param {string} title - Section heading
 * @param {React.ReactNode} summary - Always-visible summary content
 * @param {React.ReactNode} children - Expandable detailed content
 * @param {string} category - Category key for color theming (attendance, health, mood, etc.)
 * @param {boolean} defaultOpen - Whether to start expanded
 * @param {string} className - Additional classes
 */
export const CollapsibleSection = ({
  title,
  summary,
  children,
  defaultOpen = false,
  className = '',
  icon: Icon,
  badge,
  borderColor = 'border-border',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn(
      'bg-card/50 backdrop-blur-md border rounded-2xl overflow-hidden transition-all duration-300',
      borderColor,
      isOpen && 'ring-1 ring-white/5',
      className
    )}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {title}
              </h3>
              {badge && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {summary && !isOpen && (
              <div className="text-sm text-muted-foreground mt-1 truncate">
                {summary}
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-muted-foreground shrink-0 ml-4 transition-transform duration-300',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Expandable content */}
      <div className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-6 pb-6 pt-2 border-t border-border/50">
          {children}
        </div>
      </div>
    </div>
  );
};
