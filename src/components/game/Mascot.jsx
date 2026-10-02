import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Pip — TrackitAll's study buddy.
 * mood: 'idle' | 'happy' | 'cheer' | 'sleepy' | 'sad' | 'think'
 */
const INK = '#1e1b4b';

const bodyMotion = {
  idle: { animate: { y: [0, -3, 0] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  think: { animate: { y: [0, -2, 0], rotate: [0, 3, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  happy: { animate: { y: [0, -10, 0, -6, 0] }, transition: { duration: 0.9, repeat: Infinity, repeatDelay: 1.2 } },
  cheer: { animate: { y: [0, -18, 0], scaleY: [1, 1.04, 0.94, 1] }, transition: { duration: 0.65, repeat: Infinity, ease: 'easeOut' } },
  sleepy: { animate: { scale: [1, 1.03, 1] }, transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  sad: { animate: { rotate: -4, y: 4 }, transition: { duration: 0.6 } },
};

const Eyes = ({ mood }) => {
  if (mood === 'sleepy') {
    return (
      <g stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none">
        <path d="M36 62 Q45 68 54 62" />
        <path d="M66 62 Q75 68 84 62" />
      </g>
    );
  }
  if (mood === 'cheer') {
    return (
      <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M37 64 Q45 54 53 64" />
        <path d="M67 64 Q75 54 83 64" />
      </g>
    );
  }
  const look = mood === 'think' ? { x: 3, y: -3 } : mood === 'sad' ? { x: 0, y: 3 } : { x: 1, y: 1 };
  return (
    <motion.g
      animate={{ scaleY: [1, 1, 0.1, 1] }}
      transition={{ duration: 4, times: [0, 0.92, 0.95, 1], repeat: Infinity }}
      style={{ transformOrigin: '60px 62px' }}
    >
      <ellipse cx="45" cy="62" rx="11" ry="12.5" fill="#fff" />
      <ellipse cx="75" cy="62" rx="11" ry="12.5" fill="#fff" />
      <circle cx={45 + look.x} cy={63 + look.y} r="6" fill={INK} />
      <circle cx={75 + look.x} cy={63 + look.y} r="6" fill={INK} />
      <circle cx={47 + look.x} cy={60 + look.y} r="2" fill="#fff" />
      <circle cx={77 + look.x} cy={60 + look.y} r="2" fill="#fff" />
      {mood === 'sad' && (
        <>
          <path d="M33 50 L52 54" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <path d="M87 50 L68 54" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </motion.g>
  );
};

const Mouth = ({ mood }) => {
  switch (mood) {
    case 'cheer':
    case 'happy':
      return (
        <g>
          <path d="M47 80 Q60 98 73 80 Z" fill={INK} />
          <ellipse cx="60" cy="89" rx="6" ry="3.5" fill="#f472b6" />
        </g>
      );
    case 'sleepy':
      return <ellipse cx="60" cy="84" rx="4" ry="3" fill={INK} />;
    case 'sad':
      return <path d="M50 88 Q60 80 70 88" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />;
    case 'think':
      return <path d="M53 85 Q60 83 68 86" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />;
    default:
      return <path d="M50 81 Q60 91 70 81" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />;
  }
};

export const Mascot = ({ mood = 'idle', size = 120, className = '' }) => {
  // Unique per instance: a gradient defined inside a hidden copy (e.g. the desktop sidebar) won't render
  const gradId = `pip-body-${React.useId().replace(/:/g, '')}`;
  const motionProps = bodyMotion[mood] || bodyMotion.idle;
  const armsUp = mood === 'cheer';

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size * 1.08 }} aria-hidden="true">
      <motion.svg
        viewBox="0 0 120 130"
        width={size}
        height={size * 1.08}
        style={{ overflow: 'visible' }}
        {...motionProps}
      >
        <defs>
          <radialGradient id={gradId} cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#b79cff" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="60" cy="126" rx="30" ry="4" fill="#000" opacity="0.18" />

        {/* Feet */}
        <ellipse cx="46" cy="118" rx="10" ry="5" fill="#f59e0b" />
        <ellipse cx="74" cy="118" rx="10" ry="5" fill="#f59e0b" />

        {/* Arms */}
        <motion.ellipse
          cx="18" cy="84" rx="8" ry="15" fill="#7c3aed"
          animate={{ rotate: armsUp ? [-130, -160, -130] : mood === 'happy' ? [20, 35, 20] : 20 }}
          transition={{ duration: 0.5, repeat: armsUp || mood === 'happy' ? Infinity : 0 }}
          style={{ transformOrigin: '24px 74px' }}
        />
        <motion.ellipse
          cx="102" cy="84" rx="8" ry="15" fill="#7c3aed"
          animate={{ rotate: armsUp ? [130, 160, 130] : mood === 'happy' ? [-20, -35, -20] : -20 }}
          transition={{ duration: 0.5, repeat: armsUp || mood === 'happy' ? Infinity : 0 }}
          style={{ transformOrigin: '96px 74px' }}
        />

        {/* Body */}
        <ellipse cx="60" cy="76" rx="42" ry="44" fill={`url(#${gradId})`} />
        <ellipse cx="60" cy="92" rx="25" ry="22" fill="#ede9fe" opacity="0.9" />

        {/* Cheeks */}
        <ellipse cx="32" cy="78" rx="6" ry="4" fill="#f9a8d4" opacity="0.75" />
        <ellipse cx="88" cy="78" rx="6" ry="4" fill="#f9a8d4" opacity="0.75" />

        <Eyes mood={mood} />
        <Mouth mood={mood} />

        {/* Graduation cap */}
        <path d="M40 30 L40 40 Q60 49 80 40 L80 30 Z" fill="#312e81" />
        <polygon points="60,10 100,24 60,38 20,24" fill={INK} />
        <motion.g
          animate={{ rotate: mood === 'cheer' ? [0, 18, -8, 0] : [0, 6, 0] }}
          transition={{ duration: mood === 'cheer' ? 0.65 : 3, repeat: Infinity }}
          style={{ transformOrigin: '60px 24px' }}
        >
          <path d="M60 24 L92 27 L92 42" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="88.5" y="41" width="7" height="9" rx="2" fill="#f59e0b" />
        </motion.g>

        {/* Tear */}
        {mood === 'sad' && (
          <motion.ellipse
            cx="38" cy="74" rx="3" ry="4.5" fill="#7dd3fc"
            animate={{ cy: [72, 96], opacity: [1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6 }}
          />
        )}
      </motion.svg>

      {/* Zzz */}
      <AnimatePresence>
        {mood === 'sleepy' && [0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="absolute font-black text-primary"
            style={{ right: -4 - i * 6, top: 10 - i * 10, fontSize: 12 + i * 4 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 0], y: [6, -8] }}
            transition={{ duration: 2.4, delay: i * 0.6, repeat: Infinity }}
          >
            z
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Mascot with a speech bubble, used for tips, empty states and celebrations
export const MascotSays = ({ mood = 'idle', size = 88, children, className = '' }) => (
  <div className={`flex items-end gap-3 ${className}`}>
    <Mascot mood={mood} size={size} className="shrink-0" />
    <motion.div
      initial={{ opacity: 0, scale: 0.85, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="relative mb-6 rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-bold leading-snug"
    >
      <span className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-border bg-card" />
      {children}
    </motion.div>
  </div>
);

export default Mascot;
