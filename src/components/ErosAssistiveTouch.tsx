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
  
  const assistantRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const offset = useRef<Position>({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
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
      action: () => {
        // TODO: Open video call interface
        console.log('Starting video...');
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
  ];
  
  const vibrate = (duration: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      (navigator as any).vibrate(duration);
    }
  };
  
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
    if (!point) return;
    
    const rect = assistantRef.current?.getBoundingClientRect();
    
    if (rect) {
      dragStartPos.current = { x: point.clientX, y: point.clientY };
      offset.current = { 
        x: point.clientX - rect.left, 
        y: point.clientY - rect.top 
      };
      
      // Long press detection
      longPressTimer.current = setTimeout(() => {
        setMenuOpen(true);
        vibrate(50);
      }, 500);
    }
  }, []);
  
  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    const point = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
    if (!point) return;
    
    // Check if moved enough to be dragging
    const movedX = Math.abs(point.clientX - dragStartPos.current.x);
    const movedY = Math.abs(point.clientY - dragStartPos.current.y);
    
    if (movedX > 10 || movedY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      setMenuOpen(false);
      
      if (!isDragging) {
        setIsDragging(true);
      }
    }
    
    if (isDragging) {
      e.preventDefault();
      const newX = point.clientX - offset.current.x;
      const newY = point.clientY - offset.current.y;
      
      setPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - 70)),
        y: Math.max(0, Math.min(newY, window.innerHeight - 70))
      });
    }
  }, [isDragging]);
  
  const handleEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isDragging && !menuOpen) {
      // Single tap - quick action
      vibrate(30);
      // TODO: Quick action (maybe open EROS chat or match finder)
    }
    
    if (isDragging) {
      // Snap to edge
      const screenWidth = window.innerWidth;
      const midpoint = screenWidth / 2;
      
      setPosition(prev => ({
        x: prev.x < midpoint ? 10 : screenWidth - 80,
        y: Math.max(50, Math.min(prev.y, window.innerHeight - 120))
      }));
    }
    
    setIsDragging(false);
  }, [isDragging, menuOpen]);
  
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: TouchEvent | MouseEvent) => handleMove(e);
      const handleGlobalEnd = () => handleEnd();
      
      document.addEventListener('touchmove', handleGlobalMove, { passive: false });
      document.addEventListener('touchend', handleGlobalEnd);
      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      
      return () => {
        document.removeEventListener('touchmove', handleGlobalMove);
        document.removeEventListener('touchend', handleGlobalEnd);
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);
  
  return (
    <>
      <div
        ref={assistantRef}
        className={`eros-assistant ${isDragging ? 'dragging' : ''}`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px` 
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
          cursor: move;
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }

        .eros-assistant.dragging {
          transition: none !important;
          transform: scale(1.15) !important;
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

