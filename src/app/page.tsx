// app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// Animated Counter Component
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [target]);
  
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Main Landing Page Component
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [founderCount, setFounderCount] = useState(753);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Track mouse for gradient effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const testimonials = [
    { text: "EROS found me matches I'd never find on Grindr!", author: "Mike, 28", rating: 5 },
    { text: "Finally, no more endless scrolling!", author: "David, 32", rating: 5 },
    { text: "The video calls feature changed everything", author: "Alex, 25", rating: 5 },
  ];
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Dynamic Gradient Background */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(236, 72, 153, 0.15), transparent 50%)`,
        }}
      />
      
      {/* Hero Section - FULL IMPACT */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            style={{ top: '10%', left: '10%' }}
          />
          <motion.div
            className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 12, repeat: Infinity }}
            style={{ bottom: '10%', right: '10%' }}
          />
          <motion.div
            className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        </div>
        
        <motion.div 
          className="relative z-10 text-center px-4"
          style={{ y, opacity }}
        >
          {/* Launch Date Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-6"
          >
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full px-6 py-2 border border-yellow-500/30">
                <span className="text-yellow-400 font-semibold">🚀 Launching November 11, 2025</span>
            </div>
          </motion.div>
          
          {/* Main Title - HUGE IMPACT */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-7xl md:text-9xl font-black mb-6"
          >
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              SLTR
            </span>
          </motion.h1>
          
          {/* Animated Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-4xl font-bold text-white mb-4"
          >
            Dating that{' '}
            <motion.span
              className="inline-block"
              animate={{
                color: ['#ff006e', '#8b5cf6', '#00f5ff', '#ff006e'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              actually learns
            </motion.span>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            EROS AI watches who you tap, message, and video call to find matches you'll actually like. 
            No more endless grids. Just real connections.
          </motion.p>
          
          {/* CTA Buttons with hover effects */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <button className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-2xl font-bold text-xl hover:opacity-90 transition-opacity text-black">
                Get Early Access
              </button>
            </Link>

            <Link href="/pricing">
              <button className="relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-2xl font-bold text-xl hover:opacity-90 transition-opacity text-black">
                Join Founder's Circle
                <div className="absolute -top-1 -right-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                </div>
              </button>
            </Link>

            <Link href="/login">
              <button className="px-10 py-5 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-2xl font-bold text-xl hover:opacity-90 transition-opacity text-black">
                Welcome Back • Sign In
              </button>
            </Link>
          </div>
          
          {/* Founder Counter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-yellow-400 font-semibold">
              Only <AnimatedCounter target={2000 - founderCount} /> Founder spots left!
            </p>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
                See EROS in Action
              </span>
            </h2>
            <p className="text-xl text-gray-400">Watch how AI learns your real type</p>
          </motion.div>
          
          {/* Interactive Demo Card */}
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl p-8 border border-purple-500/30 backdrop-blur-xl"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-white">EROS Learns From:</h3>
                  <div className="space-y-3">
                    {[
                      { action: 'Who you tap', icon: '👆', color: 'from-pink-500 to-red-500' },
                      { action: 'Who you message', icon: '💬', color: 'from-purple-500 to-pink-500' },
                      { action: 'Video call duration', icon: '📹', color: 'from-blue-500 to-purple-500' },
                      { action: 'Response times', icon: '⚡', color: 'from-cyan-500 to-blue-500' },
                      { action: 'Who you block', icon: '🚫', color: 'from-red-500 to-pink-500' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.action}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className={`flex-1 h-2 bg-gradient-to-r ${item.color} rounded-full`}>
                          <motion.div
                            className="h-full bg-white/30 rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${80 + i * 5}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            viewport={{ once: true }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{item.action}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="relative">
                  {/* Animated Phone Mockup */}
                  <div className="relative mx-auto w-64 h-[500px] bg-gradient-to-br from-gray-900 to-black rounded-[3rem] p-3 shadow-2xl">
                    <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
                      {/* Animated profiles sliding */}
                      <motion.div
                        animate={{ y: [-400, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0"
                      >
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="p-4 border-b border-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full" />
                              <div>
                                <div className="h-3 bg-gray-700 rounded w-20 mb-2" />
                                <div className="h-2 bg-gray-800 rounded w-32" />
                              </div>
                              {i % 2 === 0 && (
                                <div className="ml-auto">
                                  <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">95% Match</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                      
                      {/* EROS indicator */}
                      <div className="absolute top-4 right-4">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center"
                        >
                          <span className="text-lg">🏹</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid - Cards that flip */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                Everything Grindr Should Have Been
              </span>
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🏹',
                title: 'EROS AI Brain',
                desc: 'Learns from behavior, not BS preferences',
                gradient: 'from-pink-500 to-purple-500',
              },
              {
                icon: '📹',
                title: 'Built-in Video',
                desc: 'HD calls without sharing your number',
                gradient: 'from-purple-500 to-blue-500',
              },
              {
                icon: '🗺️',
                title: 'Live Map',
                desc: '1000+ users visible at once',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: '🔥',
                title: 'DTFN Mode',
                desc: 'When you want it NOW',
                gradient: 'from-red-500 to-orange-500',
              },
              {
                icon: '👑',
                title: "Founder's Circle",
                desc: '$199 lifetime - no monthly BS',
                gradient: 'from-yellow-500 to-orange-500',
              },
              {
                icon: '✅',
                title: 'Verified Profiles',
                desc: 'AI-powered catfish detection',
                gradient: 'from-green-500 to-teal-500',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition`} />
                <div className="relative bg-black/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/30 transition-all">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Animated Numbers */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Beta Users', value: 10000, suffix: '+', icon: '👥' },
              { label: 'Matches Made', value: 50000, suffix: '+', icon: '💘' },
              { label: 'Video Minutes', value: 1000000, suffix: '+', icon: '📹' },
              { label: 'AI Accuracy', value: 94, suffix: '%', icon: '🎯' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                viewport={{ once: true }}
              >
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Auto-rotating */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-500 to-cyan-500 bg-clip-text text-transparent">
                Beta Users Love It
              </span>
            </h2>
          </motion.div>
          
          <div className="relative h-48">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-2xl">⭐</span>
                  ))}
                </div>
                <p className="text-2xl text-white mb-4">"{testimonials[currentTestimonial]?.text || ''}"</p>
                <p className="text-gray-400">— {testimonials[currentTestimonial]?.author || ''}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Testimonial dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTestimonial(i)}
                className={`w-2 h-2 rounded-full transition ${
                  i === currentTestimonial ? 'bg-pink-500 w-8' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Massive Impact */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
        
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Ready to Ditch the Grid?
              </span>
            </h2>
            
            <p className="text-2xl text-gray-300 mb-12">
              Join the revolution. Be a Founder. Change dating forever.
            </p>
            
            <Link href="/pricing">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <button className="group relative px-12 py-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl font-bold text-2xl text-black overflow-hidden">
                  <span className="relative z-10">Claim Your Founder Spot</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-400"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute -top-2 -right-2">
                  <span className="relative flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-yellow-500"></span>
                  </span>
                </div>
              </button>
              </motion.div>
            </Link>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12"
            >
              <p className="text-lg text-yellow-400 font-semibold">
                ⚡ Only {2000 - founderCount} spots left • $199 one-time • Lifetime access
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Available on iOS • Android • Web
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Floating EROS Assistant handled globally in layout */}

      <footer className="border-t border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-white/60">
          <span>© {new Date().getFullYear()} SLTR DIGITAL LLC. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="hidden md:block text-white/20">•</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="hidden md:block text-white/20">•</span>
            <Link href="/security" className="hover:text-white transition-colors">Security & Trust</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}