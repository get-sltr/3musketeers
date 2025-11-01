'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  // Determine active tab based on pathname
  const activeTab = pathname === '/messages' ? 'messages' 
    : pathname === '/app' ? 'map' 
    : pathname === '/groups' ? 'groups'
    : 'map'

  // TODO: Fetch unread message count from Supabase
  useEffect(() => {
    // Will implement real-time unread count later
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-500/20 bg-black/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-4">
        {/* Messages Tab */}
        <button
          onClick={() => router.push('/messages')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'messages' 
              ? 'text-cyan-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <div className="relative">
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs mt-1 font-medium">Messages</span>
          {activeTab === 'messages' && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-t-full" 
                 style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }} />
          )}
        </button>

        {/* Map Tab */}
        <button
          onClick={() => router.push('/app')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'map' 
              ? 'text-cyan-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
            />
          </svg>
          <span className="text-xs mt-1 font-medium">Map</span>
          {activeTab === 'map' && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-t-full" 
                 style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }} />
          )}
        </button>

        {/* Groups Tab */}
        <button
          onClick={() => router.push('/groups')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
            activeTab === 'groups' 
              ? 'text-cyan-400' 
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          <span className="text-xs mt-1 font-medium">Groups</span>
          {activeTab === 'groups' && (
            <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-t-full" 
                 style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.8)' }} />
          )}
        </button>
      </div>
    </nav>
  )
}
