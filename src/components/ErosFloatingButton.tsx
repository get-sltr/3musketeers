'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

export const ErosFloatingButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 100
      });
    }
  }, []);

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

      // Keep within viewport
      const maxX = typeof window !== 'undefined' ? window.innerWidth - 60 : 0;
      const maxY = typeof window !== 'undefined' ? window.innerHeight - 60 : 0;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
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

      const maxX = typeof window !== 'undefined' ? window.innerWidth - 60 : 0;
      const maxY = typeof window !== 'undefined' ? window.innerHeight - 60 : 0;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
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
      {/* Floating Button */}
      <div
        ref={buttonRef}
        className={`fixed flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 z-50 ${
          isDragging ? 'scale-110' : 'scale-100'
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#32CD32',
          boxShadow: '0 4px 12px rgba(50, 205, 50, 0.4)',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <span className="text-3xl">✕</span>
        ) : (
          <span className="text-3xl">💘</span>
        )}
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-end p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Window */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm h-96 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-semibold text-lg">EROS Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-purple-700 p-1 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Welcome Message */}
              <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700">
                <p>👋 Hi! I'm EROS. How can I help you today?</p>
                <p className="text-xs text-gray-500 mt-2">Ask me about matches, dating tips, or anything else!</p>
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t p-4 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg px-4 py-2 transition">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ErosFloatingButton;
