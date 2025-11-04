'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<'basics' | 'eros' | 'faq'>('basics');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky Header - Super Compact */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
            SLTR
          </Link>
          <span className="text-sm text-gray-400">Help Center</span>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-t border-white/10">
          {['basics', 'eros', 'faq'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === tab 
                  ? 'text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-gray-500'
              }`}
            >
              {tab === 'basics' && '✨ Basics'}
              {tab === 'eros' && '🏹 EROS'}
              {tab === 'faq' && '💬 FAQ'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'basics' && <BasicsSection key="basics" />}
        {activeTab === 'eros' && <ErosSection key="eros" />}
        {activeTab === 'faq' && <FAQSection key="faq" expandedFAQ={expandedFAQ} setExpandedFAQ={setExpandedFAQ} />}
      </AnimatePresence>

      {/* Bottom Navigation Spacing */}
      <div className="h-20"></div>
    </div>
  );
}

// Basics Section - Quick Feature Cards
function BasicsSection() {
  const features = [
    { icon: '🗺️', title: 'Map View', desc: 'See who\'s nearby in real-time' },
    { icon: '😈', title: 'Tap to Flirt', desc: 'Quick interest without messaging' },
    { icon: '📹', title: 'Video Calls', desc: 'Built-in HD video, no phone needed' },
    { icon: '🔥', title: 'DTFN Mode', desc: 'Show you\'re ready right now' },
    { icon: '👑', title: 'Founder\'s Circle', desc: '$199 lifetime premium' },
    { icon: '✅', title: 'Get Verified', desc: 'Blue check = 5x more matches' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-6 space-y-4"
    >
      {/* Quick Tips Banner */}
      <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-4 border border-pink-500/30">
        <p className="text-sm font-medium mb-1">💡 Pro Tip</p>
        <p className="text-xs text-gray-300">Complete your profile to get 3x more matches!</p>
      </div>

      {/* Feature Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3 mt-6">
        <Link href="/verify" className="block">
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Get Verified ✅</p>
              <p className="text-xs text-gray-400">Stand out with blue check</p>
            </div>
            <span className="text-xl">→</span>
          </div>
        </Link>
        
        <Link href="/founders" className="block">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Join Founder's Circle 👑</p>
              <p className="text-xs text-gray-400">Limited to first 2000</p>
            </div>
            <span className="text-xl">→</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

// EROS Section - Compact & Visual
function ErosSection() {
  const [erosEnabled, setErosEnabled] = useState(false);
  
  const steps = [
    '🏹 Find the floating arrow button',
    '👆 Long press to open menu',
    '⚡ Enable EROS AI',
    '🎯 Choose your mode',
    '✨ Watch the magic happen',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-6"
    >
      {/* EROS Hero Card */}
      <div className="bg-gradient-to-br from-pink-500/20 to-cyan-500/20 rounded-2xl p-6 border border-pink-500/30 mb-4">
        <h2 className="text-2xl font-bold mb-2">Meet EROS 🏹</h2>
        <p className="text-sm text-gray-300 mb-4">
          AI that learns who you ACTUALLY like, not who you say you like
        </p>
        
        {/* Toggle Demo */}
        <button
          onClick={() => setErosEnabled(!erosEnabled)}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            erosEnabled 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500' 
              : 'bg-white/10 border border-white/20'
          }`}
        >
          {erosEnabled ? '🏹 EROS Active' : 'Enable EROS'}
        </button>
      </div>

      {/* What EROS Does - Compact List */}
      <div className="space-y-3 mb-6">
        <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">What EROS Does</h3>
        
        {[
          { icon: '🧠', text: 'Learns from your taps, chats & calls' },
          { icon: '💘', text: 'Finds matches you\'ll actually like' },
          { icon: '💬', text: 'Creates perfect opening lines' },
          { icon: '🛡️', text: 'Blocks scams & bots automatically' },
          { icon: '🎯', text: 'Auto-pilot dating mode' },
        ].map((item, i) => (
          <motion.div
            key={item.text}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start space-x-3 bg-white/5 rounded-lg p-3"
          >
            <span className="text-xl">{item.icon}</span>
            <p className="text-sm text-gray-300">{item.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Setup Steps */}
      <div className="bg-black/50 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-sm mb-3">Quick Setup</h3>
        {steps.map((step, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className="text-xs text-cyan-400 font-mono">{i + 1}</span>
            <p className="text-xs text-gray-300">{step}</p>
          </div>
        ))}
      </div>

      {/* Privacy Note */}
      <div className="mt-4 p-3 bg-purple-500/10 border-l-2 border-purple-500 rounded">
        <p className="text-xs text-gray-300">
          <strong className="text-purple-400">Privacy:</strong> Your data never leaves your account. Disable anytime.
        </p>
      </div>
    </motion.div>
  );
}

// FAQ Section - Expandable List
function FAQSection({ expandedFAQ, setExpandedFAQ }: { expandedFAQ: number | null; setExpandedFAQ: (index: number | null) => void }) {
  const faqs = [
    {
      q: 'How is SLTR different?',
      a: 'AI learns your real preferences, built-in video calls, interactive map, no endless scrolling.',
    },
    {
      q: 'What\'s DTFN mode?',
      a: 'Shows you\'re ready to meet NOW. Only see others who are also DTFN. No time wasting.',
    },
    {
      q: 'Is EROS safe?',
      a: 'Your data stays private. Choose your privacy level. Reset or disable anytime.',
    },
    {
      q: 'What\'s Founder\'s Circle?',
      a: '$199 one-time for lifetime premium. First 2000 only. Ad-free forever.',
    },
    {
      q: 'How do video calls work?',
      a: 'Tap the camera icon in chat. No phone number needed. End-to-end encrypted.',
    },
    {
      q: 'Can I block someone?',
      a: 'Yes. Tap three dots → Block. EROS learns from blocks to hide similar profiles.',
    },
    {
      q: 'How do I get verified?',
      a: 'Take a selfie doing a specific pose. AI verifies in seconds. Get blue check.',
    },
    {
      q: 'Are there ads?',
      a: 'Free users see minimal ads. Members see fewer. Founders see none.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 py-6 pb-24"
    >
      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search help..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 text-white placeholder-gray-500"
        />
        <span className="absolute right-3 top-3 text-gray-500">🔍</span>
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/5 rounded-xl overflow-hidden border border-white/10"
          >
            <button
              onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <p className="text-sm font-medium text-left">{faq.q}</p>
              <motion.span
                animate={{ rotate: expandedFAQ === i ? 180 : 0 }}
                className="text-cyan-400 text-xs"
              >
                ▼
              </motion.span>
            </button>
            
            <AnimatePresence>
              {expandedFAQ === i && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-xs text-gray-400 leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="mt-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
        <p className="text-sm font-semibold mb-2">Still need help?</p>
        <p className="text-xs text-gray-400 mb-3">Our team responds in under 2 hours</p>
        <Link href="/support" className="block">
          <button className="w-full bg-cyan-500/20 border border-cyan-500/50 rounded-lg py-2 text-sm font-medium hover:bg-cyan-500/30 transition-colors">
            Contact Support
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

