'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import UserMenu from './UserMenu'

interface AnimatedHeaderProps {
  viewMode: 'grid' | 'map'
  onViewModeChange: (mode: 'grid' | 'map') => void
}

export default function AnimatedHeader({ viewMode, onViewModeChange }: AnimatedHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()
  
  // Animate opacity based on scroll position
  const headerOpacity = useTransform(scrollY, [0, 100], [0.95, 0.98])
  const backdropBlur = useTransform(scrollY, [0, 100], [20, 25])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      className="fixed top-0 w-full z-50 transition-all duration-300"
      style={{
        background: isScrolled 
          ? 'rgba(0, 0, 0, 0.98)' 
          : 'rgba(0, 0, 0, 0.95)',
        backdropFilter: `blur(${backdropBlur}px)`,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isScrolled 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 2px 10px rgba(0, 0, 0, 0.1)',
        opacity: headerOpacity
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between p-4">
        {/* SLTR Logo with User Menu */}
        <div className="flex items-center gap-2">
          <UserMenu />
          {/* Map session menu toggle */}
          <button
            onClick={() => window.dispatchEvent(new Event('toggle_map_session_menu'))}
            className="w-10 h-10 rounded-lg bg-black/70 border border-white/10 flex items-center justify-center hover:border-cyan-400 transition"
            title="Session Menu"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h12"/></svg>
          </button>
        </div>

        {/* View Toggle with Icons */}
        <div className="flex items-center gap-4">
          <motion.div 
            className="flex glass-bubble p-1"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
              </svg>
              <span className="text-sm font-medium">Grid</span>
            </motion.button>
            
            <motion.button
              onClick={() => onViewModeChange('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-sm font-medium">Map</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
