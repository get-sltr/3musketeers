'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtime } from '@/hooks/useRealtime'
import SpeechToText from './SpeechToText'
import MediaDrawer from './MediaDrawer'
import LocationShare from './LocationShare'
import SavedPhrases from './SavedPhrases'
import GroupCreate from './GroupCreate'

interface User {
  id: string
  username?: string
  display_name?: string
  photo?: string
  photos?: string[]
  location?: string
  city?: string
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read?: boolean
  message_type?: 'text' | 'location' | 'media'
  metadata?: {
    lat?: number
    lng?: number
    address?: string
    mediaUrl?: string
    mediaType?: string
  }
}

interface EnhancedMessagingModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  conversationId?: string | null
}

export default function EnhancedMessagingModal({
  user,
  isOpen,
  onClose,
  conversationId: initialConversationId
}: EnhancedMessagingModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  // Drawer states
  const [showMediaDrawer, setShowMediaDrawer] = useState(false)
  const [showLocationShare, setShowLocationShare] = useState(false)
  const [showSavedPhrases, setShowSavedPhrases] = useState(false)
  const [showGroupCreate, setShowGroupCreate] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const {
    isConnected,
    sendMessage: realtimeSendMessage,
    joinConversation,
    leaveConversation
  } = useRealtime()

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

  // Load messages
  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId)
    }
  }, [conversationId])

  // Join conversation room
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
          message_type: message.message_type || 'text',
          metadata: message.metadata
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
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (error) return

      const transformedMessages: Message[] = messagesData?.map((msg: any) => ({
        id: msg.id,
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        content: msg.content,
        created_at: msg.created_at,
        read: msg.read || false,
        message_type: msg.message_type || 'text',
        metadata: msg.metadata
      })) || []

      setMessages(transformedMessages)
      scrollToBottom()
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !conversationId || sending) return

    setSending(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      if (isConnected && realtimeSendMessage) {
        await realtimeSendMessage(conversationId, newMessage.trim(), 'text')
      } else {
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: currentUser.id,
            receiver_id: user!.id,
            content: newMessage.trim()
          })
        loadMessages(conversationId)
      }

      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleSpeechTranscript = useCallback((text: string) => {
    setNewMessage(prev => prev + (prev ? ' ' : '') + text)
    inputRef.current?.focus()
  }, [])

  const handleMediaSelected = async (url: string, type: 'photo' | 'video' | 'file', name: string) => {
    if (!conversationId || !user) return

    const content = type === 'photo' ? `📷 ${name}` : type === 'video' ? `🎬 ${name}` : `📎 ${name}`

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        receiver_id: user.id,
        content,
        message_type: 'media',
        metadata: { mediaUrl: url, mediaType: type }
      })

      loadMessages(conversationId)
    } catch (err) {
      console.error('Error sending media:', err)
    }
  }

  const handleLocationSend = async (location: { lat: number; lng: number; address: string }) => {
    if (!conversationId || !user) return

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        receiver_id: user.id,
        content: `📍 ${location.address}`,
        message_type: 'location',
        metadata: { lat: location.lat, lng: location.lng, address: location.address }
      })

      loadMessages(conversationId)
    } catch (err) {
      console.error('Error sending location:', err)
    }
  }

  const handlePhraseSelect = (phrase: string) => {
    setNewMessage(phrase)
    inputRef.current?.focus()
  }

  const handleSkip = () => {
    // Skip/Next functionality - close modal and potentially show next user
    onClose()
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const renderMessage = (message: Message) => {
    const isSent = message.sender_id === currentUserId

    // Location message
    if (message.message_type === 'location' && message.metadata) {
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      return (
        <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[75%] rounded-2xl overflow-hidden ${isSent ? 'bg-white' : 'bg-white/10'}`}>
            {mapboxToken && message.metadata.lat && message.metadata.lng && (
              <img
                src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+fff(${message.metadata.lng},${message.metadata.lat})/${message.metadata.lng},${message.metadata.lat},14,0/280x140@2x?access_token=${mapboxToken}`}
                alt="Location"
                className="w-full h-[140px] object-cover"
              />
            )}
            <div className={`px-4 py-2 ${isSent ? 'text-black' : 'text-white'}`}>
              <p className="text-sm font-medium">{message.metadata.address || 'Location shared'}</p>
              <p className={`text-xs mt-1 ${isSent ? 'text-black/50' : 'text-white/50'}`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Media message
    if (message.message_type === 'media' && message.metadata?.mediaUrl) {
      const isImage = message.metadata.mediaType === 'photo'
      return (
        <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[75%] rounded-2xl overflow-hidden ${isSent ? 'bg-white' : 'bg-white/10'}`}>
            {isImage ? (
              <img
                src={message.metadata.mediaUrl}
                alt="Shared media"
                className="max-w-full max-h-[300px] object-cover"
              />
            ) : (
              <div className="px-4 py-3">
                <a
                  href={message.metadata.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 ${isSent ? 'text-black' : 'text-white'}`}
                >
                  <span className="text-lg">📎</span>
                  <span className="text-sm underline">{message.content.replace('📎 ', '')}</span>
                </a>
              </div>
            )}
            <div className={`px-4 py-2 ${isSent ? 'text-black/50' : 'text-white/50'}`}>
              <p className="text-xs">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Regular text message
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[75%] px-4 py-3 rounded-[20px] ${
            isSent
              ? 'bg-white text-black rounded-br-md'
              : 'bg-white/10 text-white rounded-bl-md'
          }`}
        >
          <p className="text-[15px] leading-relaxed">{message.content}</p>
          <p className={`text-[11px] mt-1.5 ${isSent ? 'text-black/40' : 'text-white/40'}`}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  if (!isOpen || !user) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
        {/* Header - Frosted Glass */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <img
              src={user.photos?.[0] || user.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23666" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40"%3E?%3C/text%3E%3C/svg%3E'}
              alt={user.display_name || user.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
            />

            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-lg truncate">
                {user.display_name || user.username || 'User'}
              </h2>
              {(user.location || user.city) && (
                <p className="text-white/50 text-sm flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {user.city || user.location}
                </p>
              )}
            </div>

            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-white/30'}`} />
          </div>
        </div>

        {/* Messages Area - Frosted Glass Background */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="min-h-full flex flex-col justify-end py-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-white/60 text-lg">Start the conversation</p>
                  <p className="text-white/30 text-sm mt-2">Say hello to {user.display_name || 'them'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(message => (
                  <div key={message.id}>{renderMessage(message)}</div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Floating Frosted Glass Panel */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div className="mx-1 px-3 py-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl">
            {/* Message Input - Tube Style */}
            <form onSubmit={sendMessage} className="flex items-center gap-2 mb-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message ${user.display_name || user.username || ''}...`}
                  className={`
                    w-full pl-4 pr-12 py-3 text-sm
                    bg-white/5 border border-white/10
                    rounded-full text-white placeholder-white/30
                    focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-transparent
                    transition-all duration-200
                    ${isListening ? 'ring-1 ring-red-500/50 border-red-500/30' : ''}
                  `}
                  disabled={sending || !conversationId}
                />
                {/* Mic inside input */}
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <SpeechToText
                    onTranscript={handleSpeechTranscript}
                    onListeningChange={setIsListening}
                    disabled={sending || !conversationId}
                  />
                </div>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || !conversationId}
                className="p-3 bg-white text-black rounded-full hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>

            {/* 5 Function Buttons - Compact White/Monochrome */}
            <div className="flex items-center justify-between px-2">
              {/* Media */}
              <button
                onClick={() => setShowMediaDrawer(true)}
                className="p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                title="Media"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Skip */}
              <button
                onClick={handleSkip}
                className="p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                title="Skip"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>

              {/* Location */}
              <button
                onClick={() => setShowLocationShare(true)}
                className="p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                title="Share Location"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Phrases */}
              <button
                onClick={() => setShowSavedPhrases(true)}
                className="p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                title="Saved Phrases"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>

              {/* Group */}
              <button
                onClick={() => setShowGroupCreate(true)}
                className="p-2.5 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                title="Start Group"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <MediaDrawer
        isOpen={showMediaDrawer}
        onClose={() => setShowMediaDrawer(false)}
        onMediaSelected={handleMediaSelected}
        conversationId={conversationId || ''}
      />

      <LocationShare
        isOpen={showLocationShare}
        onClose={() => setShowLocationShare(false)}
        onLocationSend={handleLocationSend}
      />

      <SavedPhrases
        isOpen={showSavedPhrases}
        onClose={() => setShowSavedPhrases(false)}
        onPhraseSelect={handlePhraseSelect}
      />

      {currentUserId && (
        <GroupCreate
          isOpen={showGroupCreate}
          onClose={() => setShowGroupCreate(false)}
          currentUserId={currentUserId}
          inviteUserId={user.id}
          inviteUserName={user.display_name || user.username || 'User'}
          inviteUserPhoto={user.photos?.[0] || user.photo}
          onGroupCreated={(groupId) => {
            console.log('Group created:', groupId)
            setShowGroupCreate(false)
          }}
        />
      )}
    </>
  )
}
