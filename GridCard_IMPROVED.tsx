'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useState, useCallback, useRef, memo } from 'react';
import Image from 'next/image';

// ============================================================================
// TYPES
// ============================================================================

interface GridCardProps {
  id: string;
  name: string;
  avatar: string;
  distance: number;
  status: 'online' | 'away' | 'offline';
  vibe: string;
  headline?: string;
  age?: number;
  lastActive?: Date;
  viewCount?: number;
  isPopular?: boolean;
  isPriority?: boolean; // For image loading optimization
  onTap: () => void;
  onQuickAction?: (action: string) => void;
}

// ============================================================================
// CONSTANTS (moved outside component for performance)
// ============================================================================

const STATUS_COLORS = {
  online: { 
    bg: 'bg-emerald-500', 
    pulse: 'animate-pulse', 
    glow: 'shadow-lg shadow-emerald-500/50',
    text: 'text-emerald-300'
  },
  away: { 
    bg: 'bg-amber-500', 
    pulse: '', 
    glow: 'shadow-lg shadow-amber-500/30',
    text: 'text-amber-300'
  },
  offline: { 
    bg: 'bg-gray-500', 
    pulse: '', 
    glow: 'shadow-lg shadow-gray-500/20',
    text: 'text-gray-400'
  }
} as const;

const QUICK_ACTIONS = ['❤️ Like', '⚡ Boost', '💬 Message'] as const;

const HALO_VARIANTS = {
  rest: { 
    boxShadow: '0 0 20px rgba(14, 165, 233, 0.3), inset 0 0 20px rgba(14, 165, 233, 0.1)',
    scale: 1
  },
  hover: { 
    boxShadow: '0 0 40px rgba(14, 165, 233, 0.6), inset 0 0 30px rgba(14, 165, 233, 0.2)',
    scale: 1.02,
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    boxShadow: '0 0 30px rgba(14, 165, 233, 0.4)',
    transition: { duration: 0.1 }
  }
};

const BADGE_VARIANTS = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { delay: 0.1, type: 'spring', stiffness: 200 }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const triggerHaptic = (duration = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
};

const getLastActiveText = (date: Date): string => {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Active now';
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  return `Active ${Math.floor(hours / 24)}d ago`;
};

const getStatusText = (status: 'online' | 'away' | 'offline'): string => {
  switch (status) {
    case 'online': return '🟢 Online Now';
    case 'away': return '🟡 Away';
    case 'offline': return '⚪ Offline';
  }
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useLongPress = (callback: () => void, ms = 500) => {
  const timerRef = useRef<NodeJS.Timeout>();
  
  const start = useCallback(() => {
    timerRef.current = setTimeout(() => {
      callback();
      triggerHaptic(50);
    }, ms);
  }, [callback, ms]);
  
  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);
  
  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
};

const useDoubleTap = (callback: () => void) => {
  const lastTap = useRef(0);
  
  return useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      callback();
      triggerHaptic(30);
    }
    lastTap.current = now;
  }, [callback]);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function GridCard({
  id,
  name,
  avatar,
  distance,
  status,
  vibe,
  headline,
  age,
  lastActive,
  viewCount,
  isPopular = false,
  isPriority = false,
  onTap,
  onQuickAction
}: GridCardProps) {
  // State
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  // Derived values
  const statusStyle = STATUS_COLORS[status];
  const lastActiveText = lastActive ? getLastActiveText(lastActive) : null;

  // Handlers
  const handleLongPress = useCallback(() => {
    setShowQuickActions(true);
  }, []);

  const handleDoubleTap = useDoubleTap(() => {
    onQuickAction?.('❤️ Like');
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 1000);
  });

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onQuickAction?.('❤️ Like');
    } else if (info.offset.x < -100) {
      onQuickAction?.('Skip');
    }
  }, [onQuickAction]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTap();
    }
  }, [onTap]);

  const longPressHandlers = useLongPress(handleLongPress);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <motion.div
        layoutId={`card-${id}`}
        variants={HALO_VARIANTS}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        {...longPressHandlers}
        onClick={onTap}
        onDoubleClick={handleDoubleTap}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View ${name}'s profile, ${age ? `${age} years old, ` : ''}${distance} miles away, ${status}`}
        className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black"
        style={{ willChange: 'transform, box-shadow' }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={imageError ? '/default-avatar.png' : avatar}
            alt={name}
            fill
            className="object-cover"
            priority={isPriority}
            loading={isPriority ? 'eager' : 'lazy'}
            quality={85}
            sizes="(max-width: 768px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-60" />
        </div>

        {/* Halo Border */}
        <motion.div
          className="absolute inset-0 border-2 border-cyan-400/50 rounded-2xl pointer-events-none"
          initial={{ boxShadow: 'inset 0 0 0px rgba(34, 211, 238, 0)' }}
          whileHover={{ 
            boxShadow: 'inset 0 0 20px rgba(34, 211, 238, 0.3), 0 0 30px rgba(34, 211, 238, 0.4)'
          }}
        />

        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
          {/* Top Section: Status, Distance, Popular Badge */}
          <div className="flex justify-between items-start">
            {/* Online Status Pulse */}
            <motion.div
              className={`relative w-4 h-4 rounded-full ${statusStyle.bg} ${statusStyle.pulse} ${statusStyle.glow}`}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              aria-label={`Status: ${status}`}
            >
              <motion.div
                className={`absolute inset-0 rounded-full ${statusStyle.bg} opacity-75`}
                animate={{ scale: [1, 1.5], opacity: [0.75, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            <div className="flex gap-2">
              {/* Popular Badge */}
              {isPopular && (
                <motion.div
                  className="px-2 py-1 rounded-full bg-yellow-500/90 backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <p className="text-xs font-bold text-black">🔥 Hot</p>
                </motion.div>
              )}

              {/* Distance Badge */}
              <motion.div
                variants={BADGE_VARIANTS}
                initial="hidden"
                animate="visible"
                className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-cyan-500/30"
              >
                <p className="text-sm font-bold text-cyan-300">
                  {distance < 0.1 ? '<0.1' : distance.toFixed(1)} mi
                </p>
              </motion.div>
            </div>
          </div>

          {/* Bottom Section: Profile Info */}
          <motion.div
            className="space-y-2"
            initial={{ y: 0 }}
            whileHover={{ y: -5 }}
          >
            {/* Name & Age */}
            <div>
              <motion.h3 
                className="text-2xl font-black text-white drop-shadow-lg"
                layoutId={`name-${id}`}
              >
                {name}
                {age && <span className="text-xl text-cyan-300">, {age}</span>}
              </motion.h3>
            </div>

            {/* Vibe Tag */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-block"
            >
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/30 to-magenta-500/30 border border-cyan-400/50 text-sm font-semibold text-cyan-200">
                {vibe}
              </span>
            </motion.div>

            {/* Headline */}
            {headline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-300 line-clamp-1 italic"
              >
                "{headline}"
              </motion.p>
            )}

            {/* Status Text & Last Active */}
            <div className="flex items-center justify-between">
              <motion.p className={`text-xs font-semibold ${statusStyle.text}`}>
                {getStatusText(status)}
              </motion.p>
              {lastActiveText && (
                <p className="text-xs text-gray-400">{lastActiveText}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Hover Overlay with CTA */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <motion.button
            className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-magenta-500 text-white font-bold text-sm pointer-events-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`View ${name}'s full profile`}
          >
            View Profile →
          </motion.button>
        </motion.div>

        {/* Double-Tap Like Animation */}
        <AnimatePresence>
          {showLikeAnimation && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-8xl">❤️</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick Actions Popup */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowQuickActions(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-actions-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 space-y-3 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="quick-actions-title" className="text-lg font-bold text-white">
                Quick Actions for {name}
              </h3>
              {QUICK_ACTIONS.map((action, i) => (
                <motion.button
                  key={action}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    onQuickAction?.(action);
                    setShowQuickActions(false);
                    triggerHaptic(30);
                  }}
                  className="w-full p-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-magenta-500/20 border border-cyan-500/30 hover:border-cyan-500/60 text-white font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label={action}
                >
                  {action}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// MEMOIZED EXPORT
// ============================================================================

export default memo(GridCard, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.status === nextProps.status &&
    prevProps.distance === nextProps.distance &&
    prevProps.avatar === nextProps.avatar &&
    prevProps.isPopular === nextProps.isPopular
  );
});

