'use client';

import React, { useState } from 'react';

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
      title: 'Meet EROS',
      subtitle: 'Authentic Connections Powered by AI',
      description:
        'SLTR introduces EROS—the world\'s first hookup app with full AI integration. We\'re revolutionizing how you find real, authentic matches.',
      highlight:
        'Built for people who want genuine connections, not endless swiping. Your next connection is just smarter matching away.',
    },
    {
      icon: '🤖',
      title: 'Meet Claude. Your Matchmaker.',
      subtitle: 'EROS Powered by Anthropic',
      description:
        'EROS isn\'t an algorithm. It\'s Claude AI—a real intelligence that reads between the lines. Claude understands what makes you authentically compatible—your vibe, values, what you\'re really looking for, and who actually gets you.',
      highlight:
        'EROS does the thinking. EROS does the matching. No algorithms. No guessing. Just Claude AI finding your real people.',
    },
    {
      icon: '✨',
      title: 'EROS Does The Work',
      subtitle: 'Real Matches From Real Intelligence',
      description:
        'While you sleep, EROS analyzes genuine compatibility signals: shared interests, communication style, what you\'re actually into. Claude doesn\'t just swipe—it *thinks* about who you\'ll genuinely vibe with.',
      highlight:
        'Every match is personally selected by EROS. No algorithm filtering. No mass-produced compatibility. Just Claude AI understanding real compatibility.',
    },
    {
      icon: '💬',
      title: 'EROS In Your Pocket',
      subtitle: 'Claude Gives You Real Advice',
      description:
        'Click the 💘 button in chat. EROS—powered by Claude—helps you be authentically you. Real conversation starters that feel natural. Real advice that actually works. Real guidance from real intelligence.',
      highlight:
        'Stop overthinking. Start connecting. EROS doesn\'t give you generic tips—Claude AI gives you personalized guidance based on actual understanding.',
    },
    {
      icon: '🎯',
      title: 'EROS Changes Everything',
      subtitle: 'The AI That Cares About Your Matches',
      description:
        'Forget endless swiping through bad matches. Your daily queue is hand-picked by EROS—Claude AI thoughtfully matching you with people you genuinely vibe with. Real matches from real intelligence.',
      highlight:
        'Less swiping, more connecting. EROS matched you with them for a reason. This is dating powered by Claude AI—the way it should be.',
    },
  ];

  const clampedIndex = Math.max(0, Math.min(currentStep, steps.length - 1));
  if (steps.length === 0) return null;
  const step = steps[clampedIndex]!;
  const progress = ((clampedIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl overflow-hidden shadow-2xl border border-green-700/30">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-700 to-green-800 px-6 pt-6 pb-4">
          <div className="text-5xl mb-3">{step.icon}</div>
          <h2 className="text-3xl font-bold text-white mb-1">{step.title}</h2>
          <p className="text-green-100 text-sm">{step.subtitle}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          <p className="text-gray-300 text-base leading-relaxed">{step.description}</p>

          {/* Highlight box */}
          <div className="bg-green-700/20 border-l-4 border-green-600 pl-4 py-3 rounded">
            <p className="text-green-100 font-semibold text-sm">{step.highlight}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Step {clampedIndex + 1} of {steps.length}
              </span>
              <span className="text-xs text-green-400 font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="px-6 pb-6 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 hover:border-gray-600 transition"
            >
              Back
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-700 to-green-800 text-white font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-green-700 to-green-800 text-white font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg"
            >
              Start Using EROS
            </button>
          )}
        </div>

        {/* Dots indicator */}
        <div className="px-6 pb-4 flex justify-center gap-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition ${
                idx === currentStep
                  ? 'bg-green-600 w-6'
                  : 'bg-gray-700 hover:bg-gray-600 w-2'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
