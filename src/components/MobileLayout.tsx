'use client'

import { useState, useEffect } from 'react'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768
      setIsMobile(isMobileDevice)
      
      const isLandscape = window.innerWidth > window.innerHeight
      setOrientation(isLandscape ? 'landscape' : 'portrait')
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  // Add mobile-specific classes
  const mobileClasses = isMobile ? 'mobile-optimized' : ''
  const orientationClass = isMobile ? `mobile-${orientation}` : ''

  return (
    <div className={`app-container ${mobileClasses} ${orientationClass}`}>
      {/* Mobile-specific optimizations */}
      {isMobile && (
        <>
          {/* Touch feedback overlay */}
          <div className="touch-feedback-overlay" />
          
          {/* Mobile status bar */}
          <div className="mobile-status-bar safe-area-top" />
          
          {/* Mobile navigation hints */}
          <div className="mobile-nav-hints">
            <div className="nav-hint swipe-hint">
              <span>👆</span>
              <span>Swipe to navigate</span>
            </div>
          </div>
        </>
      )}
      
      {children}
      
      {/* Mobile-specific styles */}
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%);
        }
        
        .mobile-optimized {
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        
        .mobile-portrait {
          padding-top: max(env(safe-area-inset-top), 20px);
          /* padding-bottom handled by individual components for better control */
        }
        
        .mobile-landscape {
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        
        .touch-feedback-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9999;
        }
        
        .mobile-status-bar {
          height: 20px;
          background: rgba(0, 0, 0, 0.8);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10000;
        }
        
        .mobile-nav-hints {
          position: fixed;
          bottom: 100px; /* Above the bottom nav */
          left: 50%;
          transform: translateX(-50%);
          z-index: 40; /* Below bottom nav z-50 */
          opacity: 0.7;
          animation: fadeInOut 3s ease-in-out forwards;
          pointer-events: none;
        }
        
        .nav-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          backdrop-filter: blur(10px);
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        
        /* Touch optimizations */
        .mobile-optimized * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .mobile-optimized input,
        .mobile-optimized textarea {
          -webkit-user-select: text;
          user-select: text;
        }
        
        /* Performance optimizations - REMOVED transform to not break fixed positioning */
        .mobile-optimized {
          /* transform: translateZ(0); - REMOVED: breaks position:fixed on children! */
          /* will-change: transform; - REMOVED: breaks position:fixed on children! */
        }
        
        /* Safe area handling */
        @supports (padding: max(0px)) {
          .mobile-portrait {
            padding-top: max(env(safe-area-inset-top), 20px);
            /* padding-bottom handled by BottomNav component */
          }

          .mobile-landscape {
            padding-left: max(env(safe-area-inset-left), 0px);
            padding-right: max(env(safe-area-inset-right), 0px);
          }
        }
      `}</style>
    </div>
  )
}
