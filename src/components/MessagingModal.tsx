'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../lib/supabase/client'
import { useRealtime } from '../hooks/useRealtime'
import { useFocusTrap } from '../hooks/useFocusTrap'
import VideoCall from './VideoCall'

interface User {
  id: string
  username?: string
  display_name?: string
  photo?: string
  photos?: string[]
  age?: number
  distance?: string
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

/**
 * Grindr-Style Messaging Modal
 *
 * Features:
 * - Full-screen on mobile, slide-in panel on desktop
 * - Orange sent messages (Grindr signature)
 * - Gray received messages
 * - Minimal header with back arrow
 * - Focus trap for accessibility
 * - Real-time messaging via Supabase
 */
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
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Focus trap for accessibility
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: onClose,
    returnFocusOnDeactivate: true,
  })

  const {
    isConnected,
    sendMessage: realtimeSendMessage,
    joinConversation,
    leaveConversation
  } = useRealtime()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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

        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${currentUser.id})`)
          .maybeSingle()

        if (existingConv) {
          setConversationId(existingConv.id)
        } else {
          const { data: newConv, error: insertError } = await supabase
            .from('conversations')
            .insert({
              user1_id: currentUser.id,
              user2_id: user.id
            })
            .select('id')
            .single()

          if (newConv && !insertError) {
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
    if (!conversationId) return

    const handleNewMessage = (evt: CustomEvent) => {
      const message = evt.detail
      if (message.conversation_id === conversationId) {
        const normalized: Message = {
          id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id || '',
          content: message.content,
          created_at: message.created_at || new Date().toISOString(),
          read: message.read_at ? true : false,
        }
        setMessages(prev => {
          if (prev.some(m => m.id === normalized.id)) return prev
          return [...prev, normalized]
        })
        scrollToBottom()
      }
    }

    window.addEventListener('new_message', handleNewMessage as EventListener)
    return () => {
      window.removeEventListener('new_message', handleNewMessage as EventListener)
    }
  }, [conversationId])

  const loadMessages = async (convId: string) => {
    setMessageLoadError(null)
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        setMessageLoadError('Failed to load messages. Tap to retry.')
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
      setMessageLoadError('Failed to load messages. Tap to retry.')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversationId || sending) return

    setSending(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      if (isConnected && realtimeSendMessage) {
        await realtimeSendMessage(conversationId, newMessage.trim(), 'text')
      } else {
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: currentUser.id,
            receiver_id: user!.id,
            content: newMessage.trim()
          })

        if (!error) {
          loadMessages(conversationId)
        }
      }

      setNewMessage('')
      inputRef.current?.focus()
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen || !user) return null

  const userPhoto = user.photos?.[0] || user.photo || '/default-avatar.png'
  const userName = user.display_name || user.username || 'User'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:bg-black/40"
        onClick={onClose}
      />

      {/* Modal Container - Full screen mobile, slide-in desktop */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        tabIndex={-1}
        className="fixed inset-0 z-50 flex flex-col bg-black md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:shadow-2xl"
      >
        {/* Header - Grindr Style */}
        <header className="flex items-center gap-3 px-4 py-3 bg-black border-b border-white/10">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* User Photo */}
          <img
            src={userPhoto}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover"
          />

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold truncate">
              {userName}{user.age ? `, ${user.age}` : ''}
            </h2>
            <p className="text-white/50 text-xs truncate">
              {user.distance || (isConnected ? 'Online' : 'Offline')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Video Call */}
            <button
              onClick={() => setShowVideoCall(true)}
              disabled={!conversationId || !currentUserId}
              className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-40"
              aria-label="Video call"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* More Options */}
            <button
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="More options"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-zinc-950">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <img
                src={userPhoto}
                alt={userName}
                className="w-24 h-24 rounded-full object-cover mb-4 opacity-60"
              />
              <p className="text-white/60 text-lg font-medium">{userName}</p>
              <p className="text-white/40 text-sm mt-1">
                Say hi to start the conversation
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isSent = message.sender_id === currentUserId
                const showTime = index === 0 ||
                  new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000

                return (
                  <div key={message.id}>
                    {showTime && (
                      <div className="text-center my-3">
                        <span className="text-white/30 text-xs">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                          isSent
                            ? 'bg-orange-500 text-white rounded-br-md'
                            : 'bg-zinc-800 text-white rounded-bl-md'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Error Message */}
              {messageLoadError && (
                <button
                  onClick={() => conversationId && loadMessages(conversationId)}
                  className="flex justify-center py-4"
                >
                  <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
                    {messageLoadError}
                  </div>
                </button>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area - Grindr Style */}
        <div className="px-3 py-3 bg-black border-t border-white/10">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            {/* Photo Button */}
            <button
              type="button"
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Send photo"
            >
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-zinc-900 border-0 rounded-full px-4 py-2.5 text-white text-[15px] placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              disabled={sending || !conversationId}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || !conversationId}
              className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full transition-colors disabled:opacity-40 disabled:hover:bg-orange-500"
              aria-label="Send message"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Video Call Modal */}
      {showVideoCall && conversationId && currentUserId && (
        <VideoCall
          conversationId={conversationId}
          currentUserId={currentUserId}
          otherUserId={user.id}
          otherUserName={userName}
          onEndCall={() => setShowVideoCall(false)}
        />
      )}
    </>
  )
}
