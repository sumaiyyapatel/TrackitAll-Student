import React from 'react';
import { cn } from '@/lib/utils';

/**
 * SectionHeader - Consistent section headers with improved typography hierarchy
 * Provides clear visual distinction between heading levels.
 * 
 * @param {string} title - Main heading text
 * @param {string} subtitle - Optional subtitle/description
 * @param {React.ReactNode} action - Optional right-side action element
 * @param {'page' | 'section' | 'subsection'} level - Typography hierarchy level
 * @param {string} className - Additional classes
 */
export const SectionHeader = ({
  title,
  subtitle,
  action,
  level = 'section',
  className = '',
  children,
}) => {
  const levelStyles = {
    page: {
      title: 'text-h1 tracking-tight',
      subtitle: 'text-body text-muted-foreground mt-2',
      wrapper: 'mb-8',
    },
    section: {
      title: 'text-h2 tracking-tight',
      subtitle: 'text-body-sm text-muted-foreground mt-1',
      wrapper: 'mb-6',
    },
    subsection: {
      title: 'text-h3',
      subtitle: 'text-caption text-muted-foreground mt-0.5',
      wrapper: 'mb-4',
    },
  };

  const styles = levelStyles[level];
  const Tag = level === 'page' ? 'h1' : level === 'section' ? 'h2' : 'h3';

  return (
    <div className={cn('flex items-start justify-between gap-4', styles.wrapper, className)}>
      <div className="flex-1 min-w-0">
        <Tag
          className={cn(styles.title)}
         
        >
          {title}
        </Tag>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
