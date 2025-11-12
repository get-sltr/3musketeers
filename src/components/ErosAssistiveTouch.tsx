'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const disabledPaths = new Set([
    '/',
    '/login',
    '/signup',
    '/pricing',
    '/forgot-password',
    '/reset-password',
    '/coming-soon',
    '/privacy',
    '/terms',
    '/security',
  ]);

  if (disabledPaths.has(pathname || '')) {
    return null;
  }
  const supabase = createClient();
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const assistantRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const offset = useRef<Position>({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const dragTimeout = useRef<NodeJS.Timeout | null>(null);
  const pointerDown = useRef(false);
  const introTimeout = useRef<NodeJS.Timeout | null>(null);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const collapseTimeout = useRef<NodeJS.Timeout | null>(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [tapToast, setTapToast] = useState<string | null>(null);
  const getDefaultPosition = useCallback((): Position => {
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }

    const buttonSize = window.innerWidth <= 768 ? 60 : 70;
    const margin = 18;
    const bottomReserve = window.innerWidth <= 768 ? 130 : 150;

    const defaultX = Math.max(margin, window.innerWidth - buttonSize - margin);
    const defaultY = Math.max(60, window.innerHeight - buttonSize - bottomReserve);

    return { x: defaultX, y: defaultY };
  }, []);

  const clearCollapseTimer = useCallback(() => {
    if (collapseTimeout.current) {
      clearTimeout(collapseTimeout.current);
      collapseTimeout.current = null;
    }
  }, []);

  const keepAssistantVisible = useCallback(() => {
    setIsCollapsed(false);
    clearCollapseTimer();
  }, [clearCollapseTimer]);

  const scheduleCollapse = useCallback(() => {
    clearCollapseTimer();
    collapseTimeout.current = setTimeout(() => {
      if (!pointerDown.current) {
        setMenuOpen(false);
        setIsCollapsed(true);
      }
    }, 5000);
  }, [clearCollapseTimer]);
  const closeIntro = useCallback(() => {
    if (introTimeout.current) {
      clearTimeout(introTimeout.current);
      introTimeout.current = null;
    }
    setIntroOpen(false);
  }, []);

  const showIntro = useCallback(() => {
    closeIntro();
    setIntroOpen(true);
    introTimeout.current = setTimeout(() => {
      setIntroOpen(false);
      introTimeout.current = null;
    }, 4000);
  }, [closeIntro]);

  const showTapFeedback = useCallback((message: string) => {
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
    }
    setTapToast(message);
    tapTimeout.current = setTimeout(() => {
      setTapToast(null);
      tapTimeout.current = null;
    }, 3000);
  }, []);
  
  // Load saved position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eros_position');
      if (saved) {
        try {
          const pos = JSON.parse(saved);
          setPosition(pos);
          return;
        } catch (e) {
          // Invalid saved position, use default
        }
      }

      const defaults = getDefaultPosition();
      setPosition(defaults);
    }
  }, [getDefaultPosition]);
  
  // Save position when changed
  useEffect(() => {
    if (typeof window !== 'undefined' && !isDragging) {
      localStorage.setItem('eros_position', JSON.stringify(position));
    }
  }, [position, isDragging]);

  useEffect(() => {
    if (isCollapsed) {
      setIntroOpen(false);
      setTapToast(null);
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (isCollapsed) {
      clearCollapseTimer();
      return;
    }

    if (!menuOpen && !isDragging) {
      scheduleCollapse();
    } else {
      clearCollapseTimer();
    }

    return () => {
      clearCollapseTimer();
    };
  }, [menuOpen, isDragging, isCollapsed, scheduleCollapse, clearCollapseTimer]);
  
  const handleTapAction = useCallback(() => {
    router.push('/map')
    showTapFeedback('Open any profile • tap the 😈 bubble to send your signal.')
    closeIntro()
    keepAssistantVisible()
    scheduleCollapse()
  }, [router, showTapFeedback, closeIntro, keepAssistantVisible, scheduleCollapse])

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
      action: handleTapAction
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
          // DISABLED: EROS API temporarily disabled
          /* try {
            await fetch('/api/eros/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, analysisType: 'ultimate' })
            });
          } catch (e) {
            console.error('EROS analysis failed:', e);
          } */
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
      action: () => router.push('/settings')
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

    keepAssistantVisible();

    if (isCollapsed) {
      pointerDown.current = false;
      setIsCollapsed(false);
      setMenuOpen(false);
      scheduleCollapse();
      return;
    }

    pointerDown.current = true;

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
        closeIntro();
        vibrate(50);
        keepAssistantVisible();
      }, 400);
    }
  }, [closeIntro, isCollapsed, keepAssistantVisible, scheduleCollapse]);
  
  const handleMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!pointerDown.current) return

      keepAssistantVisible()

      const point = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent)
      if (!point) return

      const movedX = Math.abs(point.clientX - dragStartPos.current.x)
      const movedY = Math.abs(point.clientY - dragStartPos.current.y)

      if (movedX > 5 || movedY > 5) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        setMenuOpen(false)
        closeIntro()

        if (!isDragging) {
          setIsDragging(true)
          vibrate(10)
        }

        e.preventDefault()
        e.stopPropagation()

        const newX = point.clientX - offset.current.x
        const newY = point.clientY - offset.current.y

        const isMobile = window.innerWidth <= 768
        const buttonSize = isMobile ? 60 : 70
        const margin = 12
        const topGuard = 60
        const bottomReserve = isMobile ? 110 : 90
        const maxX = window.innerWidth - buttonSize - margin
        const rawMaxY = window.innerHeight - buttonSize - bottomReserve
        const maxY = Math.max(topGuard, rawMaxY)

        setPosition({
          x: Math.max(margin, Math.min(newX, maxX)),
          y: Math.max(topGuard, Math.min(newY, maxY)),
        })
      }
    },
    [isDragging, keepAssistantVisible]
  )
  
  const handleEnd = useCallback(async () => {
    pointerDown.current = false

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isDragging && !menuOpen) {
      vibrate(30);
      // Trigger EROS AI analysis silently on short press
      // DISABLED: EROS API temporarily disabled
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        /* try {
          await fetch('/api/eros/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, analysisType: 'ultimate' })
          });
        } catch (e) {
          console.error('EROS analysis failed:', e);
        } */
      }
      return;
    }
    
    if (isDragging) {
      // Snap to nearest edge (like iPhone AssistiveTouch)
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const buttonSize = screenWidth <= 768 ? 60 : 70;
      const midpoint = screenWidth / 2;
      const margin = 12;
      const topGuard = 60;
      const bottomReserve = screenWidth <= 768 ? 110 : 90;
      
      setIsAnimating(true);
      
      // Determine which edge is closer
      const currentX = position.x;
      const currentY = position.y;
      
      let targetX: number;
      let targetY: number;
      
      // Horizontal snap - always snap to left or right edge
      if (currentX < midpoint) {
        targetX = margin; // Snap to left
      } else {
        targetX = screenWidth - buttonSize - margin; // Snap to right
      }
      
      // Vertical position - keep within bounds but allow more flexibility
      const rawMaxY = screenHeight - buttonSize - bottomReserve;
      const maxY = Math.max(topGuard, rawMaxY);
      targetY = Math.max(topGuard, Math.min(currentY, maxY));
      
      // Smooth animation to target position
      setPosition({ x: targetX, y: targetY });
      
      // Reset animation flag after transition
      dragTimeout.current = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
    
    setIsDragging(false);
    scheduleCollapse();
  }, [isDragging, menuOpen, position, showTapFeedback, scheduleCollapse, supabase]);
  
  useEffect(() => {
    const handleGlobalMove = (event: TouchEvent | MouseEvent) => handleMove(event)
    const handleGlobalEnd = (event?: Event) => {
      if (pointerDown.current && event) {
        event.preventDefault()
        event.stopPropagation()
      }
      handleEnd()
    }

    document.addEventListener('touchmove', handleGlobalMove, { passive: false })
    document.addEventListener('touchend', handleGlobalEnd, { passive: false })
    document.addEventListener('touchcancel', handleGlobalEnd, { passive: false })
    document.addEventListener('mousemove', handleGlobalMove)
    document.addEventListener('mouseup', handleGlobalEnd)

    return () => {
      document.removeEventListener('touchmove', handleGlobalMove)
      document.removeEventListener('touchend', handleGlobalEnd)
      document.removeEventListener('touchcancel', handleGlobalEnd)
      document.removeEventListener('mousemove', handleGlobalMove)
      document.removeEventListener('mouseup', handleGlobalEnd)
    }
  }, [handleMove, handleEnd]);
  
  useEffect(() => {
    if (menuOpen) {
      closeIntro();
      keepAssistantVisible();
    }
  }, [menuOpen, closeIntro, keepAssistantVisible]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current);
      }
      if (introTimeout.current) {
        clearTimeout(introTimeout.current);
      }
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
      if (collapseTimeout.current) {
        clearTimeout(collapseTimeout.current);
      }
    };
  }, []);
  
  return (
    <>
      <div
        ref={assistantRef}
        className={`eros-assistant ${isDragging ? 'dragging' : ''} ${isAnimating ? 'animating' : ''} ${isCollapsed ? 'collapsed' : ''}`}
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

        {isCollapsed && (
          <div className="eros-collapsed-hint">
            <span>EROS</span>
          </div>
        )}
        
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
                keepAssistantVisible();
                scheduleCollapse();
              }}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>

        {introOpen && (
          <div className="eros-intro-popover">
            <div className="eros-intro-card">
              <div className="intro-header">Hi, I’m EROS 🏹</div>
              <p className="intro-copy">
                Quick tap unlocks tips. Press and hold for the full neon command ring.
              </p>
              <div className="intro-actions">
                <button
                  onClick={() => {
                    closeIntro();
                    setMenuOpen(true);
                    vibrate(20);
                    keepAssistantVisible();
                  }}
                  className="intro-button primary"
                >
                  Open Commands
                </button>
                <button
                  onClick={() => {
                    closeIntro();
                    scheduleCollapse();
                  }}
                  className="intro-button ghost"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {tapToast && (
        <div className="eros-toast">
          {tapToast}
        </div>
      )}
      
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

        .eros-assistant.collapsed {
          width: 54px;
          height: 54px;
          opacity: 0.9;
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

        .eros-assistant.collapsed .eros-button {
          transform: scale(0.75);
          animation: none;
          box-shadow:
            0 0 14px rgba(0, 245, 255, 0.25),
            inset 0 0 12px rgba(0, 245, 255, 0.1);
        }

        .eros-assistant.collapsed .eros-button::before {
          opacity: 0.6;
        }

        .eros-assistant.collapsed .eros-button::after {
          animation-duration: 4.5s;
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

        .eros-assistant.collapsed .eros-menu {
          display: none;
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

        .eros-collapsed-hint {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 245, 255, 0.25);
          color: #03272a;
          padding: 6px 12px 6px 16px;
          border-radius: 999px 0 0 999px;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          opacity: 0.85;
          pointer-events: none;
        }

        .eros-intro-popover {
          position: absolute;
          top: 50%;
          left: 85px;
          transform: translateY(-50%);
          pointer-events: none;
          width: 220px;
        }

        .eros-intro-card {
          pointer-events: all;
          background: rgba(6, 22, 32, 0.92);
          border: 1px solid rgba(0, 245, 255, 0.3);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(18px);
        }

        .intro-header {
          font-size: 0.85rem;
          font-weight: 700;
          color: #e8fbff;
          margin-bottom: 6px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .intro-copy {
          font-size: 0.78rem;
          line-height: 1.3;
          color: rgba(200, 249, 255, 0.85);
          margin-bottom: 10px;
        }

        .intro-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .intro-button {
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .intro-button.primary {
          background: linear-gradient(120deg, rgba(0, 245, 255, 0.9), rgba(138, 99, 255, 0.9));
          color: #021012;
          border: none;
          box-shadow: 0 8px 20px rgba(0, 200, 255, 0.25);
        }

        .intro-button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 25px rgba(0, 200, 255, 0.35);
        }

        .intro-button.ghost {
          background: rgba(0, 0, 0, 0.4);
          color: rgba(200, 249, 255, 0.7);
          border: 1px solid rgba(0, 245, 255, 0.2);
        }

        .intro-button.ghost:hover {
          border-color: rgba(0, 245, 255, 0.35);
          color: #e8fbff;
        }

        .eros-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(6, 22, 32, 0.92);
          border: 1px solid rgba(0, 245, 255, 0.35);
          color: #d9faff;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(18px);
          z-index: 9998;
        }

        @media (max-width: 768px) {
          .eros-assistant {
            width: 60px;
            height: 60px;
          }

          .eros-assistant.collapsed {
            width: 50px;
            height: 50px;
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

          .eros-intro-popover {
            left: 70px;
            width: 180px;
          }

          .intro-actions {
            flex-direction: column;
            align-items: flex-end;
          }

          .intro-button {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}

