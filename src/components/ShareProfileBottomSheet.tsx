'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Conversation {
  id: string
  other_user: {
    id: string
    display_name: string
    photo: string
    online: boolean
  }
  last_message: {
    content: string
    created_at: string
  }
  unread_count: number
}

interface ShareProfileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onShare: (conversationId: string, userId: string) => void
  currentUserId: string
}

export default function ShareProfileBottomSheet({
  isOpen,
  onClose,
  onShare,
  currentUserId
}: ShareProfileBottomSheetProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadRecentConversations()
    }
  }, [isOpen])

  const loadRecentConversations = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch recent conversations
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          last_message_at,
          profiles!conversations_user1_id_fkey(id, display_name, photo_url, is_online),
          profiles!conversations_user2_id_fkey(id, display_name, photo_url, is_online)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading conversations:', error)
        return
      }

      // Transform data to match Conversation interface
      const transformed: Conversation[] = (data || []).map((conv: any) => {
        const otherUser = conv.user1_id === user.id 
          ? conv.profiles_conversations_user2_id_fkey 
          : conv.profiles_conversations_user1_id_fkey

        return {
          id: conv.id,
          other_user: {
            id: otherUser.id,
            display_name: otherUser.display_name || 'Unknown',
            photo: otherUser.photo_url || '/icon.png',
            online: otherUser.is_online || false
          },
          last_message: {
            content: '',
            created_at: conv.last_message_at || conv.created_at
          },
          unread_count: 0
        }
      })

      setConversations(transformed)
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl z-50 animate-[slideUp_0.3s_ease-out] shadow-2xl max-h-[80vh] flex flex-col">
        <div className="p-4">
          {/* Handle bar */}
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Share Profile</h2>
            <p className="text-white/60 text-sm">Select a conversation to share your profile</p>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="text-center py-8 text-white/60">Loading...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              {searchQuery ? 'No conversations found' : 'No recent conversations'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    onShare(conv.id, conv.other_user.id)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={conv.other_user.photo || '/icon.png'}
                      alt={conv.other_user.display_name}
                      fill
                      className="object-cover"
                    />
                    {conv.other_user.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-lime-400 rounded-full border-2 border-black" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-semibold truncate">{conv.other_user.display_name}</div>
                    {conv.last_message.content && (
                      <div className="text-white/60 text-sm truncate">{conv.last_message.content}</div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-lime-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cancel button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}

