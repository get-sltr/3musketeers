'use client';

import { useEffect } from 'react';

/**
 * Hook to enable full-screen mobile app experience
 * - Hides address bar
 * - Prevents pull-to-refresh
 * - Handles orientation changes
 * - Creates native app feel
 */
export function useFullScreenMobile() {
  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // ========================================================================
    // 1. HIDE ADDRESS BAR
    // ========================================================================
    const hideAddressBar = () => {
      // Scroll down 1px to hide address bar
      if (window.scrollY < 1) {
        window.scrollTo(0, 1);
      }
      
      // Then scroll back to top
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    };

    // Hide on load
    window.addEventListener('load', hideAddressBar);
    
    // Hide on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(hideAddressBar, 100);
    });

    // Hide on resize
    window.addEventListener('resize', () => {
      setTimeout(hideAddressBar, 100);
    });

    // Initial hide
    setTimeout(hideAddressBar, 100);

    // ========================================================================
    // 2. PREVENT PULL-TO-REFRESH
    // ========================================================================
    let lastTouchY = 0;
    let preventPullToRefresh = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      lastTouchY = e.touches[0]?.clientY ?? 0;

      // Check if we're at the top of the page
      preventPullToRefresh = window.scrollY === 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!preventPullToRefresh) return;

      const touchY = e.touches[0]?.clientY ?? 0;
      const touchYDelta = touchY - lastTouchY;

      // If pulling down at top of page, prevent default
      if (touchYDelta > 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // ========================================================================
    // 3. PREVENT DOUBLE-TAP ZOOM
    // ========================================================================
    let lastTouchEnd = 0;
    
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // ========================================================================
    // 4. SET VIEWPORT HEIGHT CSS VARIABLE
    // ========================================================================
    const setViewportHeight = () => {
      // Set CSS variable for actual viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100);
    });

    // ========================================================================
    // 5. PREVENT OVERSCROLL BOUNCE (iOS)
    // ========================================================================
    const preventBounce = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow scrolling within scrollable containers
      const scrollableParent = target.closest('.mobile-content, .mobile-grid-container');
      if (scrollableParent) return;
      
      // Prevent bounce on body
      if (target === document.body) {
        e.preventDefault();
      }
    };

    document.body.addEventListener('touchmove', preventBounce, { passive: false });

    // ========================================================================
    // 6. HANDLE STANDALONE MODE (PWA)
    // ========================================================================
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');

    if (isStandalone) {
      // Add class to body for PWA-specific styles
      document.body.classList.add('pwa-standalone');
      
      // Prevent navigation away from app
      window.addEventListener('beforeunload', (e) => {
        // Only prevent if navigating away from app
        if (!e.target) return;
        e.preventDefault();
        e.returnValue = '';
      });
    }

    // ========================================================================
    // 7. HANDLE SAFE AREAS
    // ========================================================================
    const updateSafeAreas = () => {
      const safeAreaTop = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-top)') || '0px';
      const safeAreaBottom = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-bottom)') || '0px';
      
      document.documentElement.style.setProperty('--safe-area-top', safeAreaTop);
      document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
    };

    updateSafeAreas();
    window.addEventListener('resize', updateSafeAreas);

    // ========================================================================
    // CLEANUP
    // ========================================================================
    return () => {
      window.removeEventListener('load', hideAddressBar);
      window.removeEventListener('orientationchange', hideAddressBar);
      window.removeEventListener('resize', hideAddressBar);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', setViewportHeight);
      document.body.removeEventListener('touchmove', preventBounce);
      window.removeEventListener('resize', updateSafeAreas);
    };
  }, []);
}

/**
 * Hook to detect if app is running in standalone mode (PWA)
 */
export function useIsStandalone() {
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );

  return isStandalone;
}

/**
 * Hook to detect mobile device
 */
export function useIsMobile() {
  const isMobile = typeof window !== 'undefined' && 
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return isMobile;
}

