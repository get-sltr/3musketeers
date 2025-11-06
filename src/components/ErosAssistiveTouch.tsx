'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Position {
  x: number;
  y: number;
}

interface MenuAction {
  id: string;
  icon: string;
  label: string;
  action: () => void;
}

export function ErosAssistiveTouch() {
  const router = useRouter();
  const supabase = createClient();
  const [position, setPosition] = useState<Position>({ 
    x: typeof window !== 'undefined' ? window.innerWidth - 90 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight - 170 : 0 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const assistantRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const offset = useRef<Position>({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const dragTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Load saved position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eros_position');
      if (saved) {
        try {
          const pos = JSON.parse(saved);
          setPosition(pos);
        } catch (e) {
          // Invalid saved position, use default
        }
      }
    }
  }, []);
  
  // Save position when changed
  useEffect(() => {
    if (typeof window !== 'undefined' && !isDragging) {
      localStorage.setItem('eros_position', JSON.stringify(position));
    }
  }, [position, isDragging]);
  
  const menuActions: MenuAction[] = [
    { 
      id: 'match', 
      icon: '🔥', 
      label: 'Find Match', 
      action: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push(`/app?eros=match`);
        }
      }
    },
    { 
      id: 'message', 
      icon: '💬', 
      label: 'Messages', 
      action: () => router.push('/messages')
    },
    { 
      id: 'tap', 
      icon: '😈', 
      label: 'Send Tap', 
      action: () => {
        // TODO: Implement tap functionality
        console.log('Sending tap...');
      }
    },
    { 
      id: 'video', 
      icon: '📹', 
      label: 'Video Call', 
      action: async () => {
        // Navigate to messages page - user can start video call from there
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push('/messages');
          // Dispatch event to open video call modal if conversation is selected
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('eros_start_video_call'));
          }, 500);
        } else {
          router.push('/login');
        }
      }
    },
    { 
      id: 'ai', 
      icon: '🤖', 
      label: 'AI Mode', 
      action: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Trigger EROS analysis
          try {
            await fetch('/api/eros/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, analysisType: 'ultimate' })
            });
          } catch (e) {
            console.error('EROS analysis failed:', e);
          }
        }
      }
    },
    { 
      id: 'dtfn', 
      icon: '🌶️', 
      label: 'DTFN', 
      action: () => {
        router.push('/app?filter=dtfn');
      }
    },
    { 
      id: 'profile', 
      icon: '👤', 
      label: 'Profile', 
      action: () => router.push('/profile')
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      label: 'Settings', 
      action: () => router.push('/setting/5-settings-page')
    },
    { 
      id: 'pricing', 
      icon: '💎', 
      label: 'Member Services', 
      action: () => router.push('/pricing')
    },
  ];
  
  const vibrate = (duration: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      (navigator as any).vibrate(duration);
    }
  };
  
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const point = 'touches' in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
    if (!point) return;
    
    const rect = assistantRef.current?.getBoundingClientRect();
    
    if (rect) {
      dragStartPos.current = { x: point.clientX, y: point.clientY };
      offset.current = { 
        x: point.clientX - rect.left, 
        y: point.clientY - rect.top 
      };
      
      // Clear any existing animation
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current);
      }
      setIsAnimating(false);
      
      // Long press detection (reduced to 400ms for better UX)
      longPressTimer.current = setTimeout(() => {
        setMenuOpen(true);
        vibrate(50);
      }, 400);
    }
  }, []);
  
  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    const point = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
    if (!point) return;
    
    // Check if moved enough to be dragging (reduced threshold for better responsiveness)
    const movedX = Math.abs(point.clientX - dragStartPos.current.x);
    const movedY = Math.abs(point.clientY - dragStartPos.current.y);
    
    if (movedX > 5 || movedY > 5) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      setMenuOpen(false);
      
      if (!isDragging) {
        setIsDragging(true);
        vibrate(10); // Light haptic feedback when dragging starts
      }
      
      // Prevent default to avoid scrolling
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate new position
      const rect = assistantRef.current?.getBoundingClientRect();
      if (rect) {
        const newX = point.clientX - offset.current.x;
        const newY = point.clientY - offset.current.y;
        
        // Constrain to screen bounds
        const buttonSize = 70;
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    }
  }, [isDragging]);
  
  const handleEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isDragging && !menuOpen) {
      // Single tap - quick action (open EROS menu)
      vibrate(30);
      setMenuOpen(true);
      return;
    }
    
    if (isDragging) {
      // Snap to nearest edge (like iPhone AssistiveTouch)
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const buttonSize = 70;
      const midpoint = screenWidth / 2;
      const verticalMidpoint = screenHeight / 2;
      
      setIsAnimating(true);
      
      // Determine which edge is closer
      const currentX = position.x;
      const currentY = position.y;
      
      let targetX: number;
      let targetY: number;
      
      // Horizontal snap - always snap to left or right edge
      if (currentX < midpoint) {
        targetX = 10; // Snap to left
      } else {
        targetX = screenWidth - buttonSize - 10; // Snap to right
      }
      
      // Vertical position - keep within bounds but allow more flexibility
      targetY = Math.max(50, Math.min(currentY, screenHeight - buttonSize - 50));
      
      // Smooth animation to target position
      setPosition({ x: targetX, y: targetY });
      
      // Reset animation flag after transition
      dragTimeout.current = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
    
    setIsDragging(false);
  }, [isDragging, menuOpen, position]);
  
  useEffect(() => {
    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      handleMove(e);
    };
    const handleGlobalEnd = (e?: Event) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleEnd();
    };

    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalEnd, { passive: false });
    document.addEventListener('touchcancel', handleGlobalEnd, { passive: false });
    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('mouseleave', handleGlobalEnd);

    return () => {
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('touchcancel', handleGlobalEnd);
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('mouseleave', handleGlobalEnd);
    };
  }, [handleMove, handleEnd]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current);
      }
    };
  }, []);
  
  return (
    <>
      <div
        ref={assistantRef}
        className={`eros-assistant ${isDragging ? 'dragging' : ''} ${isAnimating ? 'animating' : ''}`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          transition: isDragging ? 'none' : isAnimating ? 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
        }}
        onTouchStart={handleStart}
        onMouseDown={handleStart}
      >
        <div className="eros-button">
          <span className="eros-arrow-icon">🏹</span>
        </div>
        
        <div className={`eros-menu ${menuOpen ? 'active' : ''}`}>
          {menuActions.map((action, index) => (
            <button
              key={action.id}
              className="eros-menu-item"
              style={{ '--index': index } as React.CSSProperties}
              onClick={() => {
                action.action();
                setMenuOpen(false);
                vibrate(30);
              }}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .eros-assistant {
          position: fixed;
          width: 70px;
          height: 70px;
          z-index: 9999;
          touch-action: none;
          user-select: none;
          cursor: grab;
          will-change: transform, left, top;
        }

        .eros-assistant:active {
          cursor: grabbing;
        }

        .eros-assistant.dragging {
          transition: none !important;
          transform: scale(1.15) !important;
          cursor: grabbing !important;
        }

        .eros-assistant.animating {
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                      top 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .eros-button {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(0, 245, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          position: relative;
          overflow: visible;
          box-shadow: 
            0 0 20px rgba(0, 245, 255, 0.3),
            0 0 40px rgba(0, 245, 255, 0.2),
            inset 0 0 20px rgba(0, 245, 255, 0.1);
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .eros-button::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 245, 255, 0.4) 0%, transparent 70%);
          animation: neonPulse 2s ease-in-out infinite;
        }

        @keyframes neonPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        .eros-button::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid rgba(0, 245, 255, 0.5);
          animation: ringExpand 3s linear infinite;
        }

        @keyframes ringExpand {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .eros-arrow-icon {
          z-index: 2;
          position: relative;
          filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.8));
          animation: arrowGlow 2s ease-in-out infinite alternate;
        }

        @keyframes arrowGlow {
          0% { filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.8)); }
          100% { filter: drop-shadow(0 0 15px rgba(0, 245, 255, 1)); }
        }

        .eros-menu {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 250px;
          height: 250px;
          pointer-events: none;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .eros-menu.active {
          pointer-events: all;
          opacity: 1;
        }

        .eros-menu-item {
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(10, 10, 10, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 245, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          transform: scale(0);
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.3);
          z-index: 10;
        }

        .eros-menu.active .eros-menu-item {
          opacity: 1;
          transform: scale(1);
          transition-delay: calc(var(--index) * 0.05s);
        }

        /* Position items in circle */
        .eros-menu-item:nth-child(1) { top: -80px; left: 50%; transform: translateX(-50%) scale(0); }
        .eros-menu-item:nth-child(2) { top: -56px; right: -56px; transform: scale(0); }
        .eros-menu-item:nth-child(3) { right: -80px; top: 50%; transform: translateY(-50%) scale(0); }
        .eros-menu-item:nth-child(4) { bottom: -56px; right: -56px; transform: scale(0); }
        .eros-menu-item:nth-child(5) { bottom: -80px; left: 50%; transform: translateX(-50%) scale(0); }
        .eros-menu-item:nth-child(6) { bottom: -56px; left: -56px; transform: scale(0); }
        .eros-menu-item:nth-child(7) { left: -80px; top: 50%; transform: translateY(-50%) scale(0); }
        .eros-menu-item:nth-child(8) { top: -56px; left: -56px; transform: scale(0); }

        .eros-menu.active .eros-menu-item:nth-child(1) { transform: translateX(-50%) scale(1) !important; }
        .eros-menu.active .eros-menu-item:nth-child(2) { transform: scale(1) !important; }
        .eros-menu.active .eros-menu-item:nth-child(3) { transform: translateY(-50%) scale(1) !important; }
        .eros-menu.active .eros-menu-item:nth-child(4) { transform: scale(1) !important; }
        .eros-menu.active .eros-menu-item:nth-child(5) { transform: translateX(-50%) scale(1) !important; }
        .eros-menu.active .eros-menu-item:nth-child(6) { transform: scale(1) !important; }
        .eros-menu.active .eros-menu-item:nth-child(7) { transform: translateY(-50%) scale(1) !important; }
        .eros-menu.active .eros-menu-item:nth-child(8) { transform: scale(1) !important; }

        .eros-menu-item:hover {
          background: rgba(0, 245, 255, 0.2);
          border-color: rgba(0, 245, 255, 0.6);
          transform: scale(1.1) !important;
          box-shadow: 0 0 25px rgba(0, 245, 255, 0.5);
        }

        @media (max-width: 768px) {
          .eros-assistant {
            width: 60px;
            height: 60px;
          }
          
          .eros-button {
            font-size: 28px;
          }
          
          .eros-menu {
            width: 200px;
            height: 200px;
          }
          
          .eros-menu-item {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
}

