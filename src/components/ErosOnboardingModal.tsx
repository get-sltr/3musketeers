'use client';

import React, { useState } from 'react';
import { CupidIcon } from './CupidIcon';

interface ErosOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ErosOnboardingModal({ isOpen, onClose }: ErosOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  type Step = {
    icon: string;
    title: string;
    subtitle: string;
    description: string;
    highlight: string;
  };

  const steps: Step[] = [
    {
      icon: '💘',
      title: 'Welcome to sltr',
      subtitle: 'the world\'s first social hookup app with full AI integration',
      description:
        'We\'re revolutionizing how you find real, authentic connections. Built for what we all deserve: a real good f*ck. We\'re gonna call it a match.',
      highlight:
        'No endless swiping. No bad matches. Just EROS finding your next real connection.',
    },
    {
      icon: '💘',
      title: 'Meet EROS. Powered by Anthropic\'s Claude AI',
      subtitle: 'Your Queer Matchmaker',
      description:
        'EROS isn\'t your typical AI. He\'s queer, he\'s super smart and can read between the lines! EROS understands your desires—your values, your vibe, and what you\'re really looking for. He gets who actually gets you.',
      highlight:
        'EROS does the thinking. EROS does the matching. No algorithms. No guessing. Just real intelligence finding your real people.',
    },
    {
      icon: '✨',
      title: 'EROS Does The Work',
      subtitle: 'Real Matches From Real Intelligence',
      description:
        'EROS analyzes genuine compatibility signals: shared interests, communication style, what you\'re actually into. EROS doesn\'t just swipe—it *thinks* about who you\'ll genuinely vibe with.',
      highlight:
        'Every match is personally selected by EROS. No algorithm filtering. No mass-produced compatibility. Just EROS AI understanding real compatibility and delivering what we deserve: real connections.',
    },
    {
      icon: '💬',
      title: 'EROS In Your Pocket',
      subtitle: 'Conversational Support',
      description:
        'Users can engage with EROS for: Profile optimization recommendations, Conversation starters and messaging suggestions to improve connection quality, Translations.',
      highlight:
        'Click the 💘 button in chat. EROS helps you be authentically you. Real conversation starters that feel natural. Real advice that actually works. Real guidance from a system that actually understands.',
    },
    {
      icon: '🎯',
      title: 'EROS Is Exclusive',
      subtitle: 'For SLTR Pro Members Only',
      description:
        'EROS is exclusively available to SLTR Pro members. Upgrade to unlock the future of intelligent matching and personalized connections.',
      highlight:
        'Free tier: Browse profiles. Pro tier: Unlimited messaging, video calls, travel mode, and EROS AI. Upgrade now to unlock everything.',
    },
  ];

  const clampedIndex = Math.max(0, Math.min(currentStep, steps.length - 1));
  if (steps.length === 0) return null;
  const step = steps[clampedIndex]!;
  const progress = ((clampedIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden">
      <div 
        className="relative w-full max-w-sm mx-auto flex flex-col bg-black/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20"
        style={{ 
          maxHeight: 'min(calc(100dvh - 80px), calc(100vh - 80px))',
        }}
      >
        {/* Header - compact for mobile */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 text-center">
          <div className="mb-2">
            {step.icon === '💘' ? <CupidIcon size={60} /> : <span className="text-4xl">{step.icon}</span>}
          </div>
          <h2 className="text-2xl font-bold text-lime-400 mb-1">{step.title}</h2>
          <p className="text-white/60 text-xs font-medium">{step.subtitle}</p>
        </div>

        {/* Content - scrollable if needed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          <p className="text-white/90 text-sm leading-relaxed">{step.description}</p>

          {/* Highlight box */}
          <div className="bg-lime-400/10 border border-lime-400/30 rounded-xl px-4 py-3">
            <p className="text-lime-400 font-medium text-xs leading-relaxed">{step.highlight}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-white/50 font-medium">
              {clampedIndex + 1} of {steps.length}
            </span>
            <span className="text-[10px] text-lime-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-lime-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="px-5 pb-5 flex gap-3 flex-shrink-0">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm active:scale-95 transition"
            >
              Back
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex-1 px-4 py-3 rounded-xl bg-lime-400 text-black font-bold text-sm active:scale-95 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-lime-400 text-black font-bold text-sm active:scale-95 transition"
            >
              Let's Go
            </button>
          )}
        </div>

        {/* Dots indicator */}
        <div className="px-5 pb-4 flex justify-center gap-2 flex-shrink-0">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-lime-400 w-5'
                  : 'bg-white/20 w-1.5'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
