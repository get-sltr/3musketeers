'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSocket } from '../../hooks/useSocket'
import { MessagesLoadingSkeleton } from '../../components/LoadingSkeleton'
import LazyWrapper, { LazyVideoCall, LazyFileUpload, LazyBlazeAI } from '../../components/LazyWrapper'

interface Profile {
  display_name: string
  photos: string[]
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read?: boolean
  sender_name?: string
  sender_photo?: string
  profiles?: Profile[]
}

interface Conversation {
  id: string
  other_user: {
    id: string
    display_name: string
    photo: string
    online: boolean
  }
  last_message: Message
  unread_count: number
}

// Wrap the entire component export in Suspense
function MessagesPageContent() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [currentCallUser, setCurrentCallUser] = useState<{id: string, name: string} | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [messageStatus, setMessageStatus] = useState<{[key: string]: 'sending' | 'delivered' | 'read'}>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
  const supabase = createClient()
  
  // Real-time Socket.io integration
  const { 
    socket, 
    isConnected, 
    sendMessage: socketSendMessage, 
    startTyping, 
    stopTyping, 
    joinConversation, 
    leaveConversation, 
    markMessageRead 
  } = useSocket()

  useEffect(() => {
    loadConversations()
    
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.error('Error requesting notification permission:', err)
      })
    }
    
    // Check for conversation parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const conversationParam = urlParams.get('conversation')
    if (conversationParam) {
      setSelectedConversation(conversationParam)
    }
  }, [])

  // Load unread messages when socket connects (for offline notifications)
  useEffect(() => {
    if (isConnected && socket) {
      // Reload conversations to show unread messages from offline period
      loadConversations()
    }
  }, [isConnected, socket])

  // Real-time event listeners
  useEffect(() => {
    if (!socket) return

    // Handle new messages (normalize payload fields)
    const handleNewMessage = (evt: any) => {
      const data = evt as any
      const conversationId = data.conversationId || data.conversation_id
      
      if (!conversationId) return

      // Normalize message data
      const normalized = {
        id: data.id || `tmp_${Date.now()}`,
        sender_id: data.sender_id || data.senderId,
        receiver_id: data.receiver_id || data.receiverId || '',
        content: data.content,
        created_at: data.created_at || data.createdAt || new Date().toISOString(),
        read: false,
        sender_name: data.senderName || data.sender_name,
      } as any

      // Update messages if this conversation is selected
      if (conversationId === selectedConversation) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === normalized.id)) {
            return prev
          }
          return [...prev, normalized]
        })
        scrollToBottom()
      }

      // Always update conversations list (so "envelope" shows new message)
      setConversations(prev => {
        const conversation = prev.find(c => c.id === conversationId)
        if (conversation) {
          // Update existing conversation with new last message
          return prev.map(c => 
            c.id === conversationId 
              ? {
                  ...c,
                  last_message: {
                    ...c.last_message,
                    id: normalized.id,
                    content: normalized.content,
                    created_at: normalized.created_at,
                    sender_id: normalized.sender_id,
                  },
                  unread_count: conversationId === selectedConversation 
                    ? c.unread_count 
                    : c.unread_count + 1
                }
              : c
          )
        }
        return prev
      })

      // Show browser notification (even if conversation not selected)
      if (conversationId !== selectedConversation) {
        showBrowserNotification(
          data.senderName || 'New message',
          normalized.content,
          conversationId
        )
      }
    }

    // Browser notification helper
    const showBrowserNotification = async (title: string, body: string, conversationId: string) => {
      // Request notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      // Show notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification(title, {
            body: body,
            icon: '/favicon.ico',
            tag: `message-${conversationId}`, // Prevent duplicate notifications
            requireInteraction: false,
          })

          // Handle notification click - focus window and open conversation
          notification.onclick = () => {
            window.focus()
            setSelectedConversation(conversationId)
            notification.close()
          }

          // Auto-close after 5 seconds
          setTimeout(() => notification.close(), 5000)
        } catch (error) {
          console.error('Error showing notification:', error)
        }
      }
    }

    // Handle typing indicators
    const handleUserTyping = (data: any) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => [...prev.filter(user => user !== data.username), data.username])
      }
    }

    const handleUserStopTyping = (data: any) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => {
          // Clear all typing users for this conversation
          return []
        })
      }
    }

    // Handle user presence
    const handleUserOnline = (data: any) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]))
    }

    const handleUserOffline = (data: any) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        return newSet
      })
    }

    // Handle message status updates
    const handleMessageDelivered = (data: any) => {
      setMessageStatus(prev => ({
        ...prev,
        [data.messageId]: 'delivered'
      }))
    }

    const handleMessageRead = (data: any) => {
      setMessageStatus(prev => ({
        ...prev,
        [data.messageId]: 'read'
      }))
    }

    // Add event listeners
    window.addEventListener('new_message', handleNewMessage)
    window.addEventListener('user_typing', handleUserTyping)
    window.addEventListener('user_stop_typing', handleUserStopTyping)
    window.addEventListener('user_online', handleUserOnline)
    window.addEventListener('user_offline', handleUserOffline)
    window.addEventListener('message_delivered', handleMessageDelivered)
    window.addEventListener('message_read', handleMessageRead)

    return () => {
      window.removeEventListener('new_message', handleNewMessage)
      window.removeEventListener('user_typing', handleUserTyping)
      window.removeEventListener('user_stop_typing', handleUserStopTyping)
      window.removeEventListener('user_online', handleUserOnline)
      window.removeEventListener('user_offline', handleUserOffline)
      window.removeEventListener('message_delivered', handleMessageDelivered)
      window.removeEventListener('message_read', handleMessageRead)
    }
  }, [socket, selectedConversation])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      
      // Mark conversation as read when opened
      setConversations(prev => 
        prev.map(c => 
          c.id === selectedConversation 
            ? { ...c, unread_count: 0 }
            : c
        )
      )
    }
  }, [selectedConversation])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get conversations where user is either sender or receiver
      const { data: conversationsData, error} = await supabase
        .from('conversations')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading conversations:', error)
        return
      }

      // Transform data - fetch other user profiles and last messages
      const transformedConversations: Conversation[] = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id

          // Fetch other user's profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, photos, online')
            .eq('id', otherUserId)
            .single()

          // Fetch last message for this conversation
          const { data: lastMsgArray } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
          
          const lastMsg = lastMsgArray?.[0] || null

          return {
            id: conv.id,
            other_user: {
              id: otherUserId,
              display_name: profileData?.display_name || 'Unknown User',
              photo: profileData?.photos?.[0] || 'https://via.placeholder.com/50',
              online: profileData?.online || false
            },
            last_message: {
              id: lastMsg?.id || '',
              sender_id: lastMsg?.sender_id || '',
              receiver_id: user.id,
              content: lastMsg?.content || 'No messages yet',
              created_at: lastMsg?.created_at || conv.created_at,
              sender_name: profileData?.display_name || 'Unknown'
            },
            unread_count: 0 // TODO: Implement unread count
          }
        })
      )

      setConversations(transformedConversations)

      // Auto-select the most recent conversation if none selected
      if (!selectedConversation && transformedConversations.length > 0 && transformedConversations[0]) {
        setSelectedConversation(transformedConversations[0].id)
      }
 
    } catch (err) {
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }

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

      // Debug: Log the messages data structure
      console.log('Messages data:', messagesData)

      // Option 3: Handle profiles data extraction for message list
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
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content,
          created_at: msg.created_at,
          read: msg.read,
          sender_name: profileData.display_name,
          sender_photo: profileData.photo
        }
      }) || []

      setMessages(transformedMessages)
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🎯 Send button clicked!', { newMessage, selectedConversation, sending, isConnected })
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ No user found')
        return
      }
      console.log('✅ User found:', user.id)

      // Stop typing indicator
      stopTyping(selectedConversation)

      // Send message via Socket.io for real-time delivery
      if (isConnected && socketSendMessage) {
        console.log('📤 Sending message via Socket.io to:', selectedConversation)
        const tempId = `temp_${Date.now()}`
        setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }))
        socketSendMessage(selectedConversation, newMessage.trim(), 'text')
        
        // Reload messages after delay to show the sent message (backend needs time to save)
        setTimeout(() => {
          console.log('🔄 Reloading messages after send...')
          loadMessages(selectedConversation)
        }, 1500)
      } else {
        console.log('📤 Sending message via database (socket not connected)')
        // Fallback to database-only if Socket.io not connected
        const conversation = conversations.find(c => c.id === selectedConversation)
        if (!conversation) return

        const otherUserId = conversation.other_user.id

        // Prepare message data (handle different schema versions)
        const messageDataToInsert: any = {
          conversation_id: selectedConversation,
          sender_id: user.id,
          receiver_id: otherUserId,
          content: newMessage.trim()
        }

        // Only add optional fields if they exist in schema
        // message_type might not exist in all schema versions
        const { data: messageData, error } = await supabase
          .from('messages')
          .insert(messageDataToInsert)
          .select()

        if (error) {
          console.error('❌ Error sending message:', error)
          console.error('❌ Error code:', error.code)
          console.error('❌ Error message:', error.message)
          console.error('❌ Error details:', JSON.stringify(error, null, 2))
          
          // Show user-friendly error
          alert(`Failed to send message: ${error.message || 'Unknown error'}. Check console for details.`)
          return
        }
        
        console.log('✅ Message saved to database:', messageData)

        // Reload messages to show the new one
        loadMessages(selectedConversation)
      }

      setNewMessage('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const startVideoCall = () => {
    if (selectedConversation) {
      const conversation = conversations.find(c => c.id === selectedConversation)
      if (conversation) {
        setCurrentCallUser({
          id: conversation.other_user.id,
          name: conversation.other_user.display_name
        })
        setIsVideoCallActive(true)
      }
    }
  }

  const endVideoCall = () => {
    setIsVideoCallActive(false)
    setCurrentCallUser(null)
  }

  // Handle typing indicators
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    if (selectedConversation && isConnected) {
      // Start typing indicator
      startTyping(selectedConversation)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedConversation)
      }, 1000)
    }
  }

  // Join/leave conversation when selected
  useEffect(() => {
    if (selectedConversation && isConnected) {
      joinConversation(selectedConversation)
      return () => {
        leaveConversation(selectedConversation)
      }
    }
  }, [selectedConversation, isConnected, joinConversation, leaveConversation])

  // Handle file upload
  const handleFileUploaded = (fileUrl: string, fileName: string, fileType: string) => {
    if (selectedConversation && isConnected && socketSendMessage) {
      // Send file message via Socket.io
      socketSendMessage(selectedConversation, `📎 ${fileName}`, 'file')
    }
    setShowFileUpload(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <MessagesLoadingSkeleton />
      </div>
    )
  }

  if (isVideoCallActive && currentCallUser && selectedConversation) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading video call...</div></div>}>
        <LazyVideoCall
          conversationId={selectedConversation}
          otherUserId={currentCallUser.id}
          otherUserName={currentCallUser.name}
          onEndCall={endVideoCall}
        />
      </Suspense>
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold gradient-text">Messages</h1>
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-white/60">
                {isConnected ? 'Real-time' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="pt-20 flex flex-col md:flex-row h-screen">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 md:border-r border-white/10 bg-black/50 md:h-full overflow-y-auto">
          <div className="p-4">
            <h2 className="text-white font-semibold mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <div className="text-white/60 text-center py-8">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedConversation === conversation.id
                        ? 'bg-cyan-500/20 border border-cyan-500/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={conversation.other_user.photo || 'https://via.placeholder.com/50'}
                          alt={conversation.other_user.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {conversation.other_user.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold truncate">
                            {conversation.other_user.display_name}
                          </h3>
                          <span className="text-white/60 text-xs">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm truncate">
                          {conversation.last_message.content}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="flex justify-end">
                            <span className="bg-cyan-500 text-white text-xs px-2 py-1 rounded-full">
                              {conversation.unread_count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === (conversations.find(c => c.id === selectedConversation)?.other_user.id) ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender_id === (conversations.find(c => c.id === selectedConversation)?.other_user.id)
                        ? 'bg-white/10 text-white'
                        : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    }`}>
                      {/* File Message */}
                      {message.content.startsWith('📎') && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-2xl">📎</div>
                          <div>
                            <p className="text-sm font-medium">{message.content.replace('📎 ', '')}</p>
                            <p className="text-xs opacity-70">File shared</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Regular Message */}
                      {!message.content.startsWith('📎') && (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {formatTime(message.created_at)}
                        </p>
                        {/* Message Status Indicators */}
                        {message.sender_id !== (conversations.find(c => c.id === selectedConversation)?.other_user.id) && (
                          <div className="flex items-center gap-1">
                            {messageStatus[message.id] === 'sending' && (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                            {messageStatus[message.id] === 'delivered' && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                            {messageStatus[message.id] === 'read' && (
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 text-white px-4 py-2 rounded-2xl max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-sm opacity-70">
                          {typingUsers.length === 1 
                            ? `${typingUsers[0]} is typing` 
                            : `${typingUsers.length} people are typing`
                          }
                        </span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-white/10 p-4">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-white text-xl mb-2">Select a conversation</h3>
                <p className="text-white/60">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blaze AI Assistant */}
      <Suspense fallback={<div className="fixed bottom-4 right-4 text-white/60">Loading AI...</div>}>
        <LazyBlazeAI 
          conversationId={selectedConversation || ''} 
          onAIMessage={(message) => {
            // Handle AI message - could send to conversation or show as suggestion
            console.log('AI suggested message:', message)
          }}
        />
      </Suspense>
    </div>
  )
}

// Export with top-level Suspense boundary
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black">
        <MessagesLoadingSkeleton />
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}
