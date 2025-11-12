'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SLTRLanding() {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.2) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 40%, rgba(14, 165, 233, 0.2) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* Grid background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(0deg, transparent 24%, rgba(14, 165, 233, 0.05) 25%, rgba(14, 165, 233, 0.05) 26%, transparent 27%, transparent 74%, rgba(14, 165, 233, 0.05) 75%, rgba(14, 165, 233, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(14, 165, 233, 0.05) 25%, rgba(14, 165, 233, 0.05) 26%, transparent 27%, transparent 74%, rgba(14, 165, 233, 0.05) 75%, rgba(14, 165, 233, 0.05) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Top right: Login link for existing members */}
      <motion.div
        className="absolute top-6 right-6 z-20"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => router.push('/login')}
          className="text-gray-400 hover:text-cyan-400 text-sm font-semibold transition-colors"
        >
          Already a member? <span className="text-cyan-400">Sign in →</span>
        </button>
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-8">
          <motion.h1
            className="text-7xl md:text-8xl font-black bg-gradient-to-r from-cyan-400 via-magenta-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl"
            animate={{
              textShadow: [
                '0 0 20px rgba(14, 165, 233, 0.5)',
                '0 0 40px rgba(236, 72, 153, 0.5)',
                '0 0 20px rgba(14, 165, 233, 0.5)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            SLTR
          </motion.h1>
        </motion.div>

        {/* Tagline */}
        <motion.div variants={itemVariants} className="text-center mb-12 max-w-2xl">
          <p className="text-xl md:text-2xl text-gray-300 mb-2">Stay True. Live Real.</p>
          <p className="text-sm md:text-base text-gray-500">Rules don't apply to us</p>
        </motion.div>

        {/* Description */}
        <motion.div
          variants={itemVariants}
          className="mb-16 max-w-xl text-center space-y-4"
        >
          <p className="text-lg text-gray-300 leading-relaxed">
            The dating app built for real connections.
          </p>
          <p className="text-gray-400">
            No crashes. No bots. No endless scrolling.
          </p>
          <p className="text-gray-500 text-sm">
            Just you. Real people. Real technology.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-md space-y-4"
        >
          {/* Black Card Button - ELITE */}
          <motion.button
            onClick={() => router.push('/signup?tier=blackcard')}
            onMouseEnter={() => setHoveredButton('blackcard')}
            onMouseLeave={() => setHoveredButton(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group block w-full"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
              animate={hoveredButton === 'blackcard' ? { blur: [0, 8, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-black hover:to-black text-white font-black py-4 px-8 rounded-2xl text-center transition-all shadow-lg hover:shadow-white/20 border border-white/20">
              <motion.div
                className="flex flex-col items-center justify-center gap-1"
                animate={hoveredButton === 'blackcard' ? { x: [0, 5, 0] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <span className="text-2xl">♠️</span>
                <div>
                  <div className="text-lg font-black">Black Card</div>
                  <div className="text-sm font-bold text-gray-300">$999 Lifetime Elite</div>
                </div>
              </motion.div>
            </div>
          </motion.button>

          {/* Founder's Circle Button - PAID */}
          <motion.button
            onClick={() => router.push('/signup?tier=founder')}
            onMouseEnter={() => setHoveredButton('founder')}
            onMouseLeave={() => setHoveredButton(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group block w-full"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
              animate={hoveredButton === 'founder' ? { blur: [0, 8, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black py-4 px-8 rounded-2xl text-center transition-all shadow-lg hover:shadow-amber-500/50">
              <motion.div
                className="flex flex-col items-center justify-center gap-1"
                animate={hoveredButton === 'founder' ? { x: [0, 5, 0] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <span className="text-2xl">👑</span>
                <div>
                  <div className="text-lg font-black">Founder's Circle</div>
                  <div className="text-sm font-bold text-black/80">$199 Lifetime Access</div>
                </div>
              </motion.div>
            </div>
          </motion.button>

          {/* Join as Member Button - PAID */}
          <motion.button
            onClick={() => router.push('/signup?tier=member')}
            onMouseEnter={() => setHoveredButton('member')}
            onMouseLeave={() => setHoveredButton(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group block w-full"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-magenta-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
              animate={hoveredButton === 'member' ? { blur: [0, 8, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative border-2 border-cyan-500 hover:border-cyan-400 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white font-black py-4 px-8 rounded-2xl text-center transition-all">
              <motion.div
                className="flex flex-col items-center justify-center gap-1"
                animate={hoveredButton === 'member' ? { x: [0, 5, 0] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-lg font-black">Premium Member</div>
                  <div className="text-sm font-semibold text-gray-300">$12.99/month</div>
                </div>
              </motion.div>
            </div>
          </motion.button>

          {/* Sign Up Free Button - FREE */}
          <motion.button
            onClick={() => router.push('/signup?tier=free')}
            onMouseEnter={() => setHoveredButton('signup')}
            onMouseLeave={() => setHoveredButton(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group block w-full"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-magenta-500 to-cyan-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"
              animate={hoveredButton === 'signup' ? { blur: [0, 8, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative border-2 border-magenta-500 hover:border-magenta-400 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white font-black py-4 px-8 rounded-2xl text-center transition-all">
              <motion.div
                className="flex flex-col items-center justify-center gap-1"
                animate={hoveredButton === 'signup' ? { x: [0, 5, 0] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="text-lg font-black">Join Free</div>
                  <div className="text-sm font-semibold text-gray-300">No credit card needed</div>
                </div>
              </motion.div>
            </div>
          </motion.button>
        </motion.div>

        {/* Bottom accent text */}
        <motion.div
          variants={itemVariants}
          className="mt-16 text-center text-gray-500 text-sm space-y-2"
        >
          <p>Available now at getsltr.com</p>
          <p className="text-gray-600">Real connections start here</p>
        </motion.div>
      </motion.div>

      {/* Floating orbs for extra effect */}
      <motion.div
        className="absolute top-20 right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{
          y: [0, 20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-20 left-20 w-40 h-40 bg-magenta-500/20 rounded-full blur-3xl"
        animate={{
          y: [0, -20, 0],
          x: [0, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Top accent line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-magenta-500 to-transparent opacity-50"
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}
