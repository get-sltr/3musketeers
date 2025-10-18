'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Conversation {
  id: string
  userId: string
  username: string
  photo: string
  lastMessage: string
  timestamp: string
  isOnline: boolean
  unread: number
}

export default function MessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const mockConversations: Conversation[] = [
    {
      id: '1',
      userId: '1',
      username: 'Alex',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      lastMessage: 'Hey! How are you doing today?',
      timestamp: '2m ago',
      isOnline: true,
      unread: 2
    },
    {
      id: '2',
      userId: '2',
      username: 'Jordan',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      lastMessage: 'Want to grab coffee this weekend?',
      timestamp: '1h ago',
      isOnline: false,
      unread: 0
    },
    {
      id: '3',
      userId: '3',
      username: 'Casey',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      lastMessage: 'Thanks for the great conversation! 😊',
      timestamp: '3h ago',
      isOnline: true,
      unread: 1
    },
    {
      id: '4',
      userId: '4',
      username: 'Riley',
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      lastMessage: 'Are you free tomorrow evening?',
      timestamp: '1d ago',
      isOnline: false,
      unread: 0
    },
    {
      id: '5',
      userId: '5',
      username: 'Morgan',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      lastMessage: 'That sounds amazing! Let me know when you\'re ready.',
      timestamp: '2d ago',
      isOnline: true,
      unread: 3
    },
    {
      id: '6',
      userId: '6',
      username: 'Taylor',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      lastMessage: 'Hey! How was your day?',
      timestamp: '3d ago',
      isOnline: false,
      unread: 0
    }
  ]

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between">
          <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Messages</h1>
          <Link href="/profile" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="pt-20 p-4 space-y-3">
        {mockConversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => router.push(`/messages/${conv.id}`)}
            className="glass-bubble cursor-pointer hover:bg-white/10 transition-all duration-300 p-4"
          >
            <div className="flex items-center gap-4">
              {/* Profile Photo */}
              <div className="relative">
                <img
                  src={conv.photo}
                  alt={conv.username}
                  className="w-14 h-14 rounded-full object-cover"
                />
                {conv.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {conv.username}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-sm">{conv.timestamp}</span>
                    {conv.unread > 0 && (
                      <div className="bg-gradient-to-r from-[#00d4ff] to-[#ff00ff] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-white/60 text-sm truncate">
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State (if no conversations) */}
        {mockConversations.length === 0 && (
          <div className="text-center py-12">
            <div className="glass-bubble p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
              <p className="text-white/60 mb-6">
                Start a conversation with someone you're interested in!
              </p>
              <Link
                href="/app"
                className="gradient-button py-3 px-6 rounded-xl text-white font-semibold inline-block hover:scale-105 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
                  boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
                }}
              >
                Browse Users
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
