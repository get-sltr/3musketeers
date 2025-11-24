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
      title: 'EROS Is Now Available',
      subtitle: 'To All SLTR^' + String.fromCharCode(945) + ' Members',
      description:
        'EROS is now available to all premium users. Experience the future of intelligent matching.',
      highlight:
        'Your experience increases in proportion to your membership. Free to browse. Pro to connect. EROS to match.',
    },
  ];

  const clampedIndex = Math.max(0, Math.min(currentStep, steps.length - 1));
  if (steps.length === 0) return null;
  const step = steps[clampedIndex]!;
  const progress = ((clampedIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/15">
        {/* Header - matching feedback card style */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
          <div className="mb-3">{step.icon === '💘' ? <CupidIcon size={80} /> : <span className="text-5xl">{step.icon}</span>}</div>
          <h2 className="text-3xl font-bold text-lime-400 mb-1">{step.title}</h2>
          {clampedIndex === 4 ? (
            <p className="text-sm font-medium text-white/80">
              To All <span className="text-white">SLTR</span><span className="text-lime-400">∝</span> Members
            </p>
          ) : (
            <p className="text-white/60 text-sm font-medium">{step.subtitle}</p>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          <p className="text-white/90 text-base leading-relaxed">{step.description}</p>

          {/* Highlight box - matching feedback card style */}
          <div className="bg-black/40 border border-white/15 rounded-xl px-4 py-3">
            <p className="text-lime-400 font-semibold text-sm leading-relaxed">{step.highlight}</p>
          </div>

          {/* Progress bar - matching feedback card style */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/60 font-medium">
                Step {clampedIndex + 1} of {steps.length}
              </span>
              <span className="text-xs text-lime-400 font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer with buttons - matching feedback card style */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-white/10 pt-4">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition"
            >
              Back
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex-1 px-4 py-3 rounded-xl bg-lime-400 text-black font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-lime-400 text-black font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Using EROS
            </button>
          )}
        </div>

        {/* Dots indicator - matching feedback card style */}
        <div className="px-6 pb-4 flex justify-center gap-2 flex-shrink-0">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition ${
                idx === currentStep
                  ? 'bg-lime-400 w-6'
                  : 'bg-white/20 hover:bg-white/30 w-2'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
