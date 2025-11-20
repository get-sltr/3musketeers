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

  // Initialize position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 80,
        y: window.innerHeight - 100
      });
    }
  }, []);

  // Send message to EROS (placeholder - backend integration TBD)
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Placeholder response - replace with erosAPI.chat() when backend ready
      setTimeout(() => {
        const placeholderResponses = [
          '💚 I\'m EROS, your AI matchmaker. I\'m here to help with dating advice, profile tips, and more!',
          '✨ Tell me what you\'re looking for and I can help you craft the perfect message.',
          '🎯 Want to know how to make your profile stand out? I\'ve got tips!',
          '💬 Ask me anything about dating, connections, or getting that perfect match!'
        ];
        const randomResponse = placeholderResponses[Math.floor(Math.random() * placeholderResponses.length)];
        setMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Backend not ready yet. Coming soon!' }]);
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
          <span className="text-2xl">✕</span>
        ) : (
          <CupidIcon size={48} />
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
            <div className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-semibold text-lg">EROS Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-green-800 p-1 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700">
                  <p>💘 Hi! I'm EROS. How can I help you today?</p>
                  <p className="text-xs text-gray-500 mt-2">Ask about matches, dating tips, or anything!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-green-100 text-gray-900 ml-8'
                        : 'bg-green-50 text-gray-700 mr-8'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {loading && <div className="text-sm text-gray-500 italic">EROS is thinking...</div>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t p-4 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                disabled={loading}
                className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
