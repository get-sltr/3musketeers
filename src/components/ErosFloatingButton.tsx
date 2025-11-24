// @ts-nocheck
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { erosAPI } from '@/lib/eros-api';
import { CupidIcon } from './CupidIcon';

interface Position {
  x: number;
  y: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ErosFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize position on mount - sticky above bottom nav
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updatePosition = () => {
        // Bottom nav height is ~70px + safe area, so position button above it
        const bottomNavHeight = 70 + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0);
        const buttonSize = 64;
        const padding = 16; // Space above bottom nav
        
        setPosition({
          x: window.innerWidth - buttonSize - padding,
          y: window.innerHeight - bottomNavHeight - buttonSize - padding
        });
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      
      // Also update when safe area changes (mobile rotation)
      const mediaQuery = window.matchMedia('(orientation: portrait)');
      mediaQuery.addEventListener('change', updatePosition);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        mediaQuery.removeEventListener('change', updatePosition);
      };
    }
  }, []);

  // Send message to EROS
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Use erosAPI client which handles authentication
      const response = await erosAPI.chat(userMessage, { context: 'chat_widget' });
      
      // Log full response for debugging
      console.log('🔍 EROS API Response:', {
        success: response.success,
        response: response.response?.substring(0, 100) + '...',
        intent: response.intent,
        confidence: response.confidence
      });
      
      // Display the response from EROS
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error?.message || 'Could not reach EROS. Please check your connection.';
      
      if (errorMessage.includes('Authentication required')) {
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Please log in to use EROS.' }]);
      } else if (errorMessage.includes('placeholder') || errorMessage.includes('not configured')) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '⚠️ EROS AI needs configuration. Set ANTHROPIC_API_KEY in backend environment variables.' 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${errorMessage}` }]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle mouse move - drag button
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport, but above bottom nav
      const bottomNavHeight = 70 + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0);
      const buttonSize = 64;
      const padding = 16;
      const maxX = typeof window !== 'undefined' ? window.innerWidth - buttonSize - padding : 0;
      const maxY = typeof window !== 'undefined' ? window.innerHeight - bottomNavHeight - buttonSize - padding : 0;
      const minY = padding; // Don't go above top of screen

      setPosition({
        x: Math.max(padding, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle touch dragging (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;

      // Keep within viewport, but above bottom nav
      const bottomNavHeight = 70 + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)')) || 0);
      const buttonSize = 64;
      const padding = 16;
      const maxX = typeof window !== 'undefined' ? window.innerWidth - buttonSize - padding : 0;
      const maxY = typeof window !== 'undefined' ? window.innerHeight - bottomNavHeight - buttonSize - padding : 0;
      const minY = padding;

      setPosition({
        x: Math.max(padding, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY))
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Floating Button - Sticky above bottom nav */}
      <div
        ref={buttonRef}
        className={`fixed flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 z-[9999] ${
          isDragging ? 'scale-110' : 'scale-100'
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#ccff00',
          boxShadow: '0 4px 12px rgba(204, 255, 0, 0.4)',
          userSelect: 'none',
          // Ensure it stays above bottom nav (z-index 50)
          position: 'fixed'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <span className="text-2xl">✕</span>
        ) : (
          <CupidIcon size={48} />
        )}
      </div>

      {/* Chat Slide-out Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-out Panel - Sticky above bottom nav */}
          <div 
            className="fixed right-0 top-0 z-[9999] w-full max-w-md flex flex-col animate-slideInRight"
            style={{
              bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', // Above bottom nav (70px) + safe area
              maxHeight: 'calc(100vh - 70px - env(safe-area-inset-bottom, 0px))'
            }}
          >
            {/* Header - Black with Lime Text */}
            <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg text-lime-400">EROS Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages Area - Frosted Glass */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl">
              {messages.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm text-white">
                  <p className="mb-2">💘 Hi! I'm EROS. How can I help you today?</p>
                  <p className="text-xs text-white/60">Ask about matches, dating tips, or anything!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`${
                      msg.role === 'user'
                        ? 'ml-8 bg-lime-400/20 border border-lime-400/40'
                        : 'mr-8 bg-white/10 border border-white/20'
                    } backdrop-blur-md rounded-2xl p-3 text-sm text-white`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {loading && <div className="text-sm text-white/60 italic text-center">EROS is thinking...</div>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Frosted Glass */}
            <div className="border-t border-white/10 p-4 flex gap-2 bg-white/5 backdrop-blur-xl flex-shrink-0">
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                disabled={loading}
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-lime-400 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ErosFloatingButton;
