'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../lib/supabase/client'
import { useSocket } from '../hooks/useSocket'

interface User {
  id: string
  username?: string
  display_name?: string
  photo?: string
  photos?: string[]
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read?: boolean
}

interface MessagingModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  conversationId?: string | null
}

export default function MessagingModal({ 
  user, 
  isOpen, 
  onClose, 
  conversationId: initialConversationId 
}: MessagingModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  
  const { 
    socket, 
    isConnected, 
    sendMessage: socketSendMessage, 
    joinConversation, 
    leaveConversation 
  } = useSocket()

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    if (isOpen) {
      getCurrentUser()
    }
  }, [isOpen, supabase])

  // Initialize conversation
  useEffect(() => {
    if (!isOpen || !user) return

    const initConversation = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return

        // Check if conversation exists
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${currentUser.id})`)
          .single()

        if (existingConv) {
          setConversationId(existingConv.id)
        } else {
          // Create new conversation
          const { data: newConv, error } = await supabase
            .from('conversations')
            .insert({
              user1_id: currentUser.id,
              user2_id: user.id
            })
            .select('id')
            .single()

          if (newConv && !error) {
            setConversationId(newConv.id)
          }
        }
      } catch (error) {
        console.error('Error initializing conversation:', error)
      }
    }

    initConversation()
  }, [isOpen, user, supabase])

  // Load messages when conversation is set
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
    }
  }, [conversationId])

  // Join conversation room when ready
  useEffect(() => {
    if (conversationId && isConnected) {
      joinConversation(conversationId)
      return () => {
        leaveConversation(conversationId)
      }
    }
  }, [conversationId, isConnected, joinConversation, leaveConversation])

  // Listen for new messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (evt: any) => {
      const data = evt as any
      if (data.conversationId === conversationId) {
        const normalized = {
          id: data.id || `tmp_${Date.now()}`,
          sender_id: data.sender_id || data.senderId,
          receiver_id: data.receiver_id || data.receiverId || '',
          content: data.content,
          created_at: data.created_at || data.createdAt || new Date().toISOString(),
          read: false,
        }
        setMessages(prev => {
          if (prev.some(m => m.id === normalized.id)) return prev
          return [...prev, normalized]
        })
        scrollToBottom()
      }
    }

    window.addEventListener('new_message', handleNewMessage)
    return () => {
      window.removeEventListener('new_message', handleNewMessage)
    }
  }, [socket, conversationId])

  const loadMessages = async (convId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      const transformedMessages: Message[] = messagesData?.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        content: msg.content,
        created_at: msg.created_at,
        read: msg.read || false,
      })) || []

      setMessages(transformedMessages)
      scrollToBottom()
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId || sending) return

    setSending(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      if (isConnected && socketSendMessage) {
        socketSendMessage(conversationId, newMessage.trim(), 'text')
        
        // Reload messages after delay
        setTimeout(() => {
          loadMessages(conversationId)
        }, 1000)
      } else {
        // Fallback to database
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: currentUser.id,
            receiver_id: user!.id,
            content: newMessage.trim()
          })

        if (error) {
          console.error('Error sending message:', error)
          return
        }

        loadMessages(conversationId)
      }

      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-[80vh] max-h-[600px] bg-black/95 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header - Shows who you're messaging */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img
            src={user.photos?.[0] || user.photo || 'https://via.placeholder.com/50'}
            alt={user.display_name || user.username}
            className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500/30"
          />
          
          <div className="flex-1">
          <h2 className="text-white font-bold text-lg">
            {user.display_name || user.username || 'User'}
          </h2>
            <p className="text-white/60 text-xs">
              {isConnected ? 'Real-time • Online' : 'Offline'}
            </p>
          </div>

          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-white/60">No messages yet</p>
                <p className="text-white/40 text-sm mt-2">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isSent = message.sender_id === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isSent
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-white/50'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-white/10">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${user.display_name || user.username || 'User'}...`}
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              disabled={sending || !conversationId}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !conversationId}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </div>
  )
}

