'use client'

// Phase 3 fixed
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import LoadingSkeleton from '@/components/LoadingSkeleton'

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: Date
  isSent: boolean
}

export default function ConversationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // All hooks must be at the top
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  
  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setConversationId(id)
      setLoading(false)
    }
    getParams()
  }, [params])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  useEffect(() => {
    // Load real messages for this conversation
    if (conversationId) {
      loadMessages(conversationId)
    }
  }, [conversationId])

  const loadMessages = async (conversationId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey (
            display_name,
            photos
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      // Option 3: Handle profiles data extraction for individual conversation
      const transformedMessages: Message[] = messagesData?.map((msg: any) => {
        // Handle both array and single object cases for profiles
        let profileData = { display_name: 'Unknown', photo: '' }
        
        if (msg.profiles) {
          if (Array.isArray(msg.profiles)) {
            // If profiles is an array, get the first one
            profileData = {
              display_name: msg.profiles[0]?.display_name || 'Unknown',
              photo: msg.profiles[0]?.photos?.[0] || ''
            }
          } else {
            // If profiles is a single object
            profileData = {
              display_name: msg.profiles.display_name || 'Unknown',
              photo: msg.profiles.photos?.[0] || ''
            }
          }
        }

        return {
          id: msg.id,
          senderId: msg.sender_id,
          text: msg.content,
          timestamp: new Date(msg.created_at),
          isSent: msg.sender_id === (await supabase.auth.getUser()).data.user?.id
        }
      }) || []

      setMessages(transformedMessages)
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <LoadingSkeleton variant="fullscreen" />
      </div>
    )
  }
  
  if (!conversationId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Invalid conversation</p>
      </div>
    )
  }

  const [conversation, setConversation] = useState({
    username: 'Loading...',
    photo: '',
    isOnline: false
  })

  useEffect(() => {
    if (conversationId) {
      loadConversationData(conversationId)
    }
  }, [conversationId])

  const loadConversationData = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get conversation details
      const { data: conversationData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          profiles!conversations_user1_id_fkey (
            id,
            display_name,
            photos,
            online
          ),
          profiles!conversations_user2_id_fkey (
            id,
            display_name,
            photos,
            online
          )
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        console.error('Error loading conversation:', error)
        return
      }

      // Option 1 & 2: Handle both array and single object cases for profiles
      let otherUser = null
      
      if (conversationData.profiles) {
        if (Array.isArray(conversationData.profiles)) {
          // If profiles is an array, find the other user
          otherUser = conversationData.user1_id === user.id 
            ? conversationData.profiles[1] 
            : conversationData.profiles[0]
        } else {
          // If profiles is a single object, use it directly
          otherUser = conversationData.profiles
        }
      }

      if (otherUser) {
        setConversation({
          username: otherUser.display_name || 'Unknown',
          photo: otherUser.photos?.[0] || '',
          isOnline: otherUser.online || false
        })
      }
    } catch (err) {
      console.error('Error loading conversation data:', err)
    }
  }



  const handleSend = async () => {
    if (!message.trim() || sending || !conversationId) return
    
    setSending(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get the other user ID from conversation data
      const { data: conversationData } = await supabase
        .from('conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single()

      if (!conversationData) return

      const otherUserId = conversationData.user1_id === user.id 
        ? conversationData.user2_id 
        : conversationData.user1_id

      // Send message to database
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: otherUserId,
          content: message.trim()
        })

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      // Add message to local state immediately for better UX
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: user.id,
        text: message.trim(),
        timestamp: new Date(),
        isSent: true
      }
      
      setMessages(prev => [...prev, newMessage])
      setMessage('')
      
      // Reload messages to get the real message from database
      loadMessages(conversationId)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading conversation...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center gap-4">
          <Link href="/messages" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={conversation.photo}
                alt={conversation.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              {conversation.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
              )}
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{conversation.username}</h2>
              <p className="text-white/60 text-sm">
                {conversation.isOnline ? 'Online' : 'Last seen recently'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pt-20 pb-20 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${msg.isSent ? 'sent-bubble' : 'received-bubble'}`}>
              <p className="text-white text-sm leading-relaxed">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.isSent ? 'text-white/60' : 'text-white/40'}`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {sending && (
          <div className="flex justify-end">
            <div className="sent-bubble opacity-70">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-white/60 text-xs">Sending...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="fixed bottom-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 p-4">
        <div className="glass-bubble flex items-center gap-3 p-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-white placeholder-white/40"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="gradient-button w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
            }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
