import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPageMeta } from '@/lib/game/trackers';
import { cn } from '@/lib/utils';

/**
 * Page title with a chunky emoji tile in the tracker's colour.
 * Emoji/colour default to the current route's tracker.
 */
export const PageHeader = ({ title, subtitle, emoji, colorClass, actions, className = '' }) => {
  const { pathname } = useLocation();
  const meta = getPageMeta(pathname);
  const tileEmoji = emoji ?? meta?.emoji;
  const tileColor = colorClass ?? meta?.color.bg ?? 'bg-primary';

  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 items-center gap-4">
        {tileEmoji && (
          <motion.div
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-[inset_0_-5px_0_rgba(0,0,0,0.22)]',
              tileColor
            )}
            aria-hidden="true"
          >
            {tileEmoji}
          </motion.div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black sm:text-3xl">{title ?? meta?.label}</h1>
          {(subtitle ?? meta?.blurb) && <p className="text-sm text-muted-foreground">{subtitle ?? meta?.blurb}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
