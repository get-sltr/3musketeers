'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SLTRLanding() {
  const router = useRouter();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);

  // Generate whirlpool dots for splash effect
  const whirlpoolDots = useMemo(() => {
    const dots = [];
    for (let i = 0; i < 100; i++) {
      dots.push({
        id: i,
        angle: (i / 100) * Math.PI * 2,
        distance: Math.random() * 50 + 10,
        delay: i * 0.01,
      });
    }
    return dots;
  }, []);

  const handleJoinClick = () => {
    setShowSplash(true);
    setTimeout(() => {
      router.push('/signup?tier=free');
    }, 1500);
  };

  const handleSignInClick = () => {
    setShowSplash(true);
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  } as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Hero Background Image with Gradient Opacity */}
      <div className="absolute inset-0">
        <Image
          src="/hero-model.jpg"
          alt="SLTR"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient Fade Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.80) 50%, rgba(0,0,0,0.70) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* SLTR Logo */}
        <motion.div
          variants={itemVariants}
          className="mb-8 flex flex-col items-center"
        >
          <div className="flex items-center gap-6 mb-2">
            {/* Dot Grid with Bubble Effect */}
            <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              {/* 4x4 grid with bubble effect (middle dots larger) */}
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3].map((col) => {
                  const x = 15 + col * 20;
                  const y = 15 + row * 20;
                  // Middle dots are larger (bubble effect)
                  const isMiddle = (row === 1 || row === 2) && (col === 1 || col === 2);
                  const radius = isMiddle ? 8 : 5;
                  return (
                    <circle
                      key={`${row}-${col}`}
                      cx={x}
                      cy={y}
                      r={radius}
                      fill="#ccff00"
                    />
                  );
                })
              )}
            </svg>
            
            {/* Text: s l t r - larger size */}
            <div className="text-7xl md:text-9xl font-black tracking-[0.3em] text-lime-400">
              sltr
            </div>
          </div>
          
          {/* Tagline underneath - much smaller */}
          <p className="text-[10px] md:text-xs tracking-[0.4em] text-white/60 uppercase font-medium">
            RULES DON'T APPLY
          </p>
        </motion.div>

        {/* Accent line */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="h-1 w-32 bg-lime-400 mx-auto rounded-full" />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="w-full max-w-sm space-y-4">
          {/* Join Free Button */}
          <motion.button
            onClick={handleJoinClick}
            onMouseEnter={() => setHoveredButton('primary')}
            onMouseLeave={() => setHoveredButton(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full relative group"
          >
            <motion.div
              className="absolute inset-0 bg-lime-400 rounded-full blur-lg opacity-0 group-hover:opacity-75 transition-opacity"
              animate={hoveredButton === 'primary' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <div className="relative bg-lime-400 hover:bg-lime-300 text-black font-black py-5 px-8 rounded-full text-center transition-all text-lg tracking-wide">
              Join Free
            </div>
          </motion.button>

          {/* Sign In Button */}
          <motion.button
            onClick={handleSignInClick}
            onMouseEnter={() => setHoveredButton('signin')}
            onMouseLeave={() => setHoveredButton(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full relative group"
          >
            <motion.div
              className="absolute inset-0 bg-lime-400/30 rounded-full blur-lg opacity-0 group-hover:opacity-75 transition-opacity"
              animate={hoveredButton === 'signin' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
            <div className="relative bg-transparent border-2 border-lime-400 hover:bg-lime-400/10 text-lime-400 font-black py-5 px-8 rounded-full text-center transition-all text-lg tracking-wide">
              Already a member? Sign in
            </div>
          </motion.button>
        </motion.div>

        {/* Secondary Text */}
        <motion.p
          variants={itemVariants}
          className="mt-8 text-gray-400 text-sm text-center max-w-md"
        >
          No credit card needed. Real connections. Real people.
        </motion.p>

        {/* Bottom accent text */}
        <motion.div
          variants={itemVariants}
          className="mt-16 text-center text-gray-500 text-sm space-y-2"
        >
          <p>Available now at getsltr.com</p>
          <p className="text-gray-600">Real connections start here</p>
        </motion.div>

        {/* Footer with Company Info & Policy Links */}
        <motion.footer
          variants={itemVariants}
          className="mt-20 mb-8 text-center text-gray-500 text-xs space-y-3"
        >
          <div className="space-y-1">
            <p className="font-semibold text-gray-400">SLTR DIGITAL LLC</p>
            <p className="text-gray-600">Innovative | Intelligence | Intuitive</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-gray-600">
            <button
              onClick={() => router.push('/privacy')}
              className="hover:text-lime-400 transition-colors"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => router.push('/terms')}
              className="hover:text-lime-400 transition-colors"
            >
              Terms of Service
            </button>
          </div>
          <p className="text-gray-700">© {new Date().getFullYear()} SLTR Digital LLC. All rights reserved.</p>
        </motion.footer>
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

      {/* Whirlpool Splash Effect */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {whirlpoolDots.map((dot) => (
              <motion.div
                key={dot.id}
                className="absolute w-3 h-3 bg-lime-400 rounded-full"
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos(dot.angle) * dot.distance * 20,
                  y: Math.sin(dot.angle) * dot.distance * 20,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                  rotate: [0, 360 * 3],
                }}
                transition={{
                  duration: 1.5,
                  delay: dot.delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
