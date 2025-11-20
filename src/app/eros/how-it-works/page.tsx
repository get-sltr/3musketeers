'use client';

import React from 'react';

export default function ErosHowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">How EROS Works</h1>
          <p className="text-xl text-green-100">
            AI-powered intelligent matching powered by Anthropic Claude
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Anthropic Badge */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-700 rounded-lg p-6 mb-12 text-center">
          <p className="text-sm font-semibold text-green-900 uppercase tracking-wide mb-2">Powered By</p>
          <h2 className="text-3xl font-bold text-green-900 mb-2">Anthropic Claude AI</h2>
          <p className="text-green-800">
            EROS is built on Anthropic's advanced Claude AI, the most capable AI assistant for understanding complex human interactions.
          </p>
        </div>

        {/* The Problem */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">The Problem</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">❌ Information Overload</h3>
              <p className="text-gray-700">
                Swiping through endless profiles is exhausting. You need intelligent filtering.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">❌ Compatibility Guessing</h3>
              <p className="text-gray-700">
                Traditional apps guess compatibility. You deserve precision matching.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">❌ Bad Conversations</h3>
              <p className="text-gray-700">
                You're stuck with generic openers. You need real connection guidance.
              </p>
            </div>
          </div>
        </section>

        {/* EROS Solution */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">EROS: The Solution</h2>
          <p className="text-lg text-gray-700 mb-8">
            EROS is the dating intelligence layer powered by Anthropic Claude. It analyzes your profile, preferences, and behavior to deliver hyper-personalized matches and real-time dating advice.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-lg border-2 border-green-700">
              <h3 className="text-2xl font-bold text-green-900 mb-4">✨ What EROS Does</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🧠</span>
                  <span className="text-gray-800"><strong>Analyzes Your Profile</strong> - Understands your personality, values, and dating goals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">📊</span>
                  <span className="text-gray-800"><strong>Scores Compatibility</strong> - Rates matches beyond surface-level attraction</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">💬</span>
                  <span className="text-gray-800"><strong>Real-Time Guidance</strong> - Chat with EROS for dating advice instantly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🎯</span>
                  <span className="text-gray-800"><strong>Smart Recommendations</strong> - Delivers curated matches tailored to you</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg border-2 border-blue-700">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">🚀 Why EROS Is Different</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🤖</span>
                  <span className="text-gray-800"><strong>Claude AI Powered</strong> - Most advanced AI understanding human dynamics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">🔒</span>
                  <span className="text-gray-800"><strong>Privacy First</strong> - Runs offline during your idle time, zero tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">⚡</span>
                  <span className="text-gray-800"><strong>No Interruptions</strong> - Analysis happens when you're not swiping</span>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">❤️</span>
                  <span className="text-gray-800"><strong>Connection Focused</strong> - Optimized for real relationships, not engagement</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How It Works Step-by-Step */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How EROS Matches You</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-lg">
                  1
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">You Relax, EROS Analyzes</h3>
                <p className="text-gray-700">
                  When you're idle for 10+ minutes, EROS silently reads your profile, photos, interests, and past conversations. Claude AI learns what makes you tick—your humor style, relationship goals, core values, and deal-breakers.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-lg">
                  2
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Matching Algorithm</h3>
                <p className="text-gray-700">
                  Claude AI analyzes every potential match's profile using the same depth it analyzed yours. It compares personality traits, values, lifestyle choices, and relationship goals. Compatibility scores include factors humans often overlook.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-lg">
                  3
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Daily Curated Queue</h3>
                <p className="text-gray-700">
                  Next time you open SLTR, you see your daily matches—pre-filtered and ranked by compatibility. No endless swiping. Just profiles you'll actually click with, delivered fresh each day.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-lg">
                  4
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Chat Guidance</h3>
                <p className="text-gray-700">
                  About to message a match? Unsure how to respond? Click the 💘 EROS button in chat. Get instant advice on openers, conversation starters, or how to handle tricky situations. Claude's emotional intelligence is your wingperson.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-green-700 text-white font-bold text-lg">
                  5
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Learn & Improve</h3>
                <p className="text-gray-700">
                  As you interact, EROS learns what works for you and what doesn't. Your matches improve. Your advice gets more personalized. The system gets smarter every day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Technology */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">The Technology Behind EROS</h2>
          
          <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Powered by Anthropic Claude</h3>
            <p className="text-gray-700 mb-4">
              EROS uses Anthropic's Claude AI, a large language model trained to understand nuanced human interactions. Claude excels at:
            </p>
            <ul className="grid md:grid-cols-2 gap-4 mb-6">
              <li className="flex items-start">
                <span className="text-green-700 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Understanding Context</strong> - Grasps relationship dynamics beyond surface-level matching</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-700 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Nuanced Analysis</strong> - Catches subtle compatibility signals other systems miss</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-700 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Conversation Skills</strong> - Provides emotionally intelligent dating advice</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-700 font-bold mr-3">✓</span>
                <span className="text-gray-700"><strong>Privacy Focused</strong> - Anthropic prioritizes user privacy and safety</span>
              </li>
            </ul>

            <div className="bg-green-50 p-4 rounded border-l-4 border-green-700">
              <p className="text-sm text-gray-700">
                <strong>Learn more:</strong> Visit <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-900 underline">Anthropic.com</a> to understand Claude's capabilities.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy & Security */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Privacy & Security</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-700">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔒 Your Data is Yours</h3>
              <p className="text-gray-700">
                EROS never sells your data. All analysis is performed with strict privacy controls in compliance with GDPR and CCPA.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-700">
              <h3 className="text-lg font-bold text-gray-900 mb-3">⚡ Offline Processing</h3>
              <p className="text-gray-700">
                Heavy analysis happens during your idle time using optimized algorithms, not while you're actively dating.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-700">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🛡️ Encrypted Communication</h3>
              <p className="text-gray-700">
                All messages with EROS are encrypted end-to-end. No one else can see your conversations or advice requests.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Real EROS Use Cases</h2>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">💌 "Should I message them back?"</h3>
              <p className="text-gray-700">
                Screenshot their profile. Ask EROS for first-impression analysis and conversation advice. Get a personalized opener in seconds.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🎯 "How is my profile doing?"</h3>
              <p className="text-gray-700">
                EROS reviews your photos, bio, and interests. It identifies what's working, what's not, and how to improve your match rate.
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-bold text-gray-900 mb-2">❤️ "Are we compatible?"</h3>
              <p className="text-gray-700">
                Curious about someone you matched with? EROS breaks down compatibility by personality, values, lifestyle, and relationship goals.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-700">
              <h3 className="text-lg font-bold text-gray-900 mb-2">🚀 "How do I get better matches?"</h3>
              <p className="text-gray-700">
                EROS learns from your swipes and conversations. Every day, your match queue gets smarter and more personalized.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose SLTR with EROS */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Choose SLTR + EROS?</h2>
          
          <div className="bg-gradient-to-r from-green-700 to-green-800 text-white p-10 rounded-lg">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">Tired of the Dating App Grind?</h3>
                <p className="text-green-50 mb-4">
                  SLTR is built for people who want real connections, not endless swiping. EROS is our secret weapon—powered by Anthropic Claude AI, the most advanced AI for understanding human compatibility.
                </p>
                <ul className="space-y-2 text-green-100">
                  <li>✅ Smarter matches, fewer swipes</li>
                  <li>✅ Real-time dating advice from AI wingperson</li>
                  <li>✅ Privacy-first, no engagement tricks</li>
                  <li>✅ Powered by Anthropic Claude—the best AI on Earth</li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">The EROS Advantage</h3>
                <p className="text-green-50 mb-4">
                  When other apps are optimizing for screen time, EROS optimizes for your happiness. Our AI learns what you actually want and finds it for you.
                </p>
                <div className="bg-white bg-opacity-10 p-4 rounded border-l-4 border-green-300">
                  <p className="text-green-50">
                    <strong>Result:</strong> Users report 3x better match quality and 50% less swipe fatigue compared to traditional apps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-12 border-t-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Meet Your Match?</h2>
          <p className="text-xl text-gray-700 mb-8">
            Join SLTR today and experience the future of dating powered by Anthropic Claude.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-700 to-green-800 text-white px-8 py-3 rounded-lg font-bold hover:from-green-800 hover:to-green-900 transition">
              Get Started
            </button>
            <button className="bg-white border-2 border-green-700 text-green-700 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition">
              Learn More
            </button>
          </div>

          {/* Footer CTA */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">Questions about EROS?</h3>
            <p className="text-gray-700 mb-4">
              Read our <a href="/eros/privacy" className="text-green-700 hover:text-green-900 underline">Privacy Policy</a> and <a href="/eros/terms" className="text-green-700 hover:text-green-900 underline">Terms of Service</a>.
            </p>
            <p className="text-sm text-gray-600">
              Questions? Email support@sltr.app
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
