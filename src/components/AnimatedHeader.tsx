'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'
import UserMenu from './UserMenu'

interface AnimatedHeaderProps {
  viewMode: 'grid' | 'map'
  onViewModeChange: (mode: 'grid' | 'map') => void
}

export default function AnimatedHeader({ viewMode, onViewModeChange }: AnimatedHeaderProps) {
  const t = useTranslations('nav')
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
      className="fixed top-0 w-full z-30 transition-all duration-300 min-h-[56px]"
      style={{
        background: isScrolled
          ? 'linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(26, 10, 46, 0.95) 100%)'
          : 'linear-gradient(180deg, rgba(10, 10, 15, 0.95) 0%, rgba(26, 10, 46, 0.92) 100%)',
        backdropFilter: `blur(${backdropBlur}px)`,
        borderBottom: '2px solid transparent',
        borderImage: 'linear-gradient(90deg, rgba(204, 255, 0, 0.3), rgba(204, 255, 0, 0.3), rgba(204, 255, 0, 0.3)) 1',
        boxShadow: isScrolled
          ? '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 40px rgba(204, 255, 0, 0.15)'
          : '0 2px 16px rgba(0, 0, 0, 0.4), 0 0 30px rgba(204, 255, 0, 0.1)',
        opacity: headerOpacity,
        paddingTop: 'env(safe-area-inset-top)'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between p-2 sm:p-3">
        {/* SLTR Logo with User Menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <UserMenu />
          {/* Map session menu toggle - only show on map view */}
          {viewMode === 'map' && (
            <button
              onClick={() => window.dispatchEvent(new Event('toggle_map_session_menu'))}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-black/70 border border-white/10 flex items-center justify-center hover:border-lime-400 transition flex-shrink-0"
              title="Session Menu"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h12"/></svg>
            </button>
          )}
        </div>

        {/* View Toggle with Icons */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <motion.div 
            className="flex glass-bubble p-1"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-lime-400 text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/>
              </svg>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">{t('grid')}</span>
            </motion.button>

            <motion.button
              onClick={() => onViewModeChange('map')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-lime-400 text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">{t('map')}</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
