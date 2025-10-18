'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: Date
  isSent: boolean
}

export default async function ConversationPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  
  if (!id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Invalid conversation</p>
      </div>
    )
  }
  
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Mock conversation data
  const mockConversations = {
    '1': {
      username: 'Alex',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      isOnline: true
    },
    '2': {
      username: 'Jordan',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      isOnline: false
    },
    '3': {
      username: 'Casey',
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      isOnline: true
    }
  }

  const conversation = mockConversations[id as keyof typeof mockConversations] || {
    username: 'Unknown',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    isOnline: false
  }

  // Mock messages
  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: id || 'unknown',
      text: 'Hey! How are you doing today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isSent: false
    },
    {
      id: '2',
      senderId: 'me',
      text: 'I\'m doing great! Thanks for asking. How about you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      isSent: true
    },
    {
      id: '3',
      senderId: id || 'unknown',
      text: 'Pretty good! Just working on some projects. What are you up to?',
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      isSent: false
    },
    {
      id: '4',
      senderId: 'me',
      text: 'Same here! Working on this new app. It\'s been really exciting!',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isSent: true
    },
    {
      id: '5',
      senderId: id || 'unknown',
      text: 'That sounds amazing! I\'d love to hear more about it sometime.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      isSent: false
    },
    {
      id: '6',
      senderId: 'me',
      text: 'Absolutely! Maybe we could grab coffee and I can show you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isSent: true
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

  useEffect(() => {
    // Load messages for this conversation
    setMessages(mockMessages)
  }, [id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || sending) return
    
    setSending(true)
    
    // Add message to list
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: message,
      timestamp: new Date(),
      isSent: true
    }
    
    setMessages(prev => [...prev, newMessage])
    setMessage('')
    
    // Simulate response after 1-3 seconds
    setTimeout(() => {
      const responses = [
        'That sounds interesting!',
        'I see what you mean.',
        'Tell me more about that!',
        'That\'s really cool!',
        'I\'d love to hear more.',
        'That makes sense.',
        'I agree with you on that.',
        'That\'s a great point!'
      ]
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: id || 'unknown',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        isSent: false
      }
      
      setMessages(prev => [...prev, responseMessage])
    }, Math.random() * 2000 + 1000)
    
    setSending(false)
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
