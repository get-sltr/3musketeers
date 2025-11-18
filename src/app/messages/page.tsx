'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRealtime } from '../../hooks/useRealtime'
import { useNotifications } from '../../hooks/useNotifications'
import { MessagesLoadingSkeleton } from '../../components/LoadingSkeleton'
import LazyWrapper, { LazyVideoCall, LazyFileUpload, LazyErosAI } from '../../components/LazyWrapper'
import BottomNav from '../../components/BottomNav'

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
  const [swipedConversation, setSwipedConversation] = useState<string | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [touchStart, setTouchStart] = useState<number>(0)
  const [touchEnd, setTouchEnd] = useState<number>(0)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [isMuted, setIsMuted] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
  const supabase = createClient()
  
  // Real-time Supabase Realtime integration
  const { 
    isConnected, 
    sendMessage: realtimeSendMessage, 
    startTyping, 
    stopTyping, 
    joinConversation, 
    leaveConversation, 
    markMessageRead 
  } = useRealtime()

  // Push notifications
  const { showMessageNotification, permission: notifPermission, debugNotifications } = useNotifications()

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    loadConversations()

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => {
        console.error('Error requesting notification permission:', err)
      })
    }

    // Check for conversation parameter in URL (this is a USER ID, not conversation ID)
    const urlParams = new URLSearchParams(window.location.search)
    const userIdParam = urlParams.get('conversation')
    if (userIdParam) {
      // Find or create conversation with this user
      findOrCreateConversation(userIdParam)
    }
  }, [])

  // Load unread messages when realtime connects (for offline notifications)
  useEffect(() => {
    if (isConnected) {
      // Reload conversations to show unread messages from offline period
      loadConversations()
    }
  }, [isConnected])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('[data-menu]')) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  // Real-time event listeners for Supabase Realtime
  useEffect(() => {
    // Handle new messages from Supabase Realtime
    const handleNewMessage = (evt: CustomEvent) => {
      const data = evt.detail
      const conversationId = data.conversation_id
      
      if (!conversationId) return

      // Normalize message data from Supabase
      const normalized = {
        id: data.id || `tmp_${Date.now()}`,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id || '',
        content: data.content,
        created_at: data.created_at || new Date().toISOString(),
        read: data.read_at ? true : false,
        sender_name: data.sender_name,
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

      // Show push notification (works even if tab is closed)
      if (conversationId !== selectedConversation) {
        showMessageNotification(
          normalized.sender_name || 'Unknown',
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

    // Handle typing indicators from Supabase broadcast events (dispatched by useRealtime)
    const handleUserTyping = (evt: CustomEvent) => {
      const data = evt.detail
      if (data.conversationId === selectedConversation) {
        // Get user display name from conversations
        const conversation = conversations.find(c => c.id === selectedConversation)
        const userName = conversation?.other_user.display_name || 'Someone'
        setTypingUsers(prev => [...prev.filter(user => user !== userName), userName])
      }
    }

    const handleUserStopTyping = (evt: CustomEvent) => {
      const data = evt.detail
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => {
          // Clear all typing users for this conversation
          return []
        })
      }
    }

    // Handle message status updates from Supabase
    const handleMessageUpdated = (evt: CustomEvent) => {
      const data = evt.detail
      if (data.read_at) {
      setMessageStatus(prev => ({
        ...prev,
          [data.id]: 'read'
      }))
    }
    }

    // Add event listeners for Supabase Realtime events
    window.addEventListener('new_message', handleNewMessage as EventListener)
    window.addEventListener('message_updated', handleMessageUpdated as EventListener)
    window.addEventListener('user_typing', handleUserTyping as EventListener)
    window.addEventListener('user_stop_typing', handleUserStopTyping as EventListener)

    return () => {
      window.removeEventListener('new_message', handleNewMessage as EventListener)
      window.removeEventListener('message_updated', handleMessageUpdated as EventListener)
      window.removeEventListener('user_typing', handleUserTyping as EventListener)
      window.removeEventListener('user_stop_typing', handleUserStopTyping as EventListener)
    }
  }, [selectedConversation, conversations, isConnected, supabase])

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

  // Listen for EROS video call trigger
  useEffect(() => {
    let shouldStartCall = false
    
    const handleErosVideoCall = () => {
      if (selectedConversation) {
        // Start call immediately
        shouldStartCall = true
        setTimeout(() => {
          if (shouldStartCall && selectedConversation) {
            const conversation = conversations.find(c => c.id === selectedConversation)
            if (conversation) {
              setCurrentCallUser({
                id: conversation.other_user.id,
                name: conversation.other_user.display_name
              })
              setIsVideoCallActive(true)
            }
          }
          shouldStartCall = false
        }, 100)
      } else if (conversations.length > 0) {
        // If no conversation selected, select the first one
        const firstConversation = conversations[0]
        if (firstConversation) {
          shouldStartCall = true
          setSelectedConversation(firstConversation.id)
        }
      }
    }

    window.addEventListener('eros_start_video_call', handleErosVideoCall)
    return () => {
      window.removeEventListener('eros_start_video_call', handleErosVideoCall)
    }
  }, [selectedConversation, conversations])

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
              photo: profileData?.photos?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23aaa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E',
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

  const findOrCreateConversation = async (targetUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First, check if a conversation already exists between these users
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id, user1_id, user2_id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)

      if (existingConversations && existingConversations.length > 0 && existingConversations[0]) {
        // Conversation exists, select it
        console.log('✅ Found existing conversation:', existingConversations[0].id)
        setSelectedConversation(existingConversations[0].id)
        return
      }

      // No conversation exists, create one
      console.log('📝 Creating new conversation with user:', targetUserId)
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: targetUserId
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating conversation:', error)
        return
      }

      console.log('✅ Created new conversation:', newConversation.id)

      // Reload conversations to include the new one
      await loadConversations()

      // Select the new conversation
      setSelectedConversation(newConversation.id)
    } catch (err) {
      console.error('Error finding/creating conversation:', err)
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

      // Send message via Supabase Realtime
      if (isConnected && realtimeSendMessage) {
        console.log('📤 Sending message via Supabase Realtime to:', selectedConversation)
        const tempId = `temp_${Date.now()}`
        setMessageStatus(prev => ({ ...prev, [tempId]: 'sending' }))
        await realtimeSendMessage(selectedConversation, newMessage.trim(), 'text')
        
        // Message will appear via Realtime subscription automatically
        // No need to reload, but we can mark it as delivered
        setTimeout(() => {
          setMessageStatus(prev => ({ ...prev, [tempId]: 'delivered' }))
        }, 500)
      } else {
        console.log('📤 Realtime not connected, using direct database insert')
        // Fallback to database-only if Realtime not connected
        const conversation = conversations.find(c => c.id === selectedConversation)
        if (!conversation) {
          console.error('❌ Conversation not found')
          return
        }

        const otherUserId = conversation.other_user.id

        // Use the same format as useRealtime hook to avoid trigger conflicts
        const messageDataToInsert: any = {
          conversation_id: selectedConversation,
          sender_id: user.id,
          receiver_id: otherUserId,
          content: newMessage.trim()
        }

        // Insert message - same format as useRealtime hook
        const { data: messageData, error } = await supabase
          .from('messages')
          .insert(messageDataToInsert)
          .select()

        if (error) {
          console.error('❌ Error sending message:', error)
          console.error('❌ Error code:', error.code)
          console.error('❌ Error message:', error.message)
          console.error('❌ Error details:', JSON.stringify(error, null, 2))
          
          // Try using useRealtime's sendMessage function instead
          console.log('🔄 Retrying with useRealtime sendMessage...')
          try {
            await realtimeSendMessage(selectedConversation, newMessage.trim(), 'text')
            console.log('✅ Message sent via useRealtime')
          } catch (realtimeError) {
            console.error('❌ Realtime send also failed:', realtimeError)
            alert(`Failed to send message: ${error.message}. Please try again.`)
          }
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
    if (selectedConversation && isConnected && realtimeSendMessage) {
      // Send file message via Supabase Realtime
      realtimeSendMessage(selectedConversation, `📎 ${fileName}`, 'file', fileUrl)
    }
    setShowFileUpload(false)
  }

  // Handle archive conversation
  const handleArchiveConversation = async (conversationId: string) => {
    try {
      // TODO: Add archived field to conversations table or create archived_conversations table
      // For now, just remove from view
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
      }
      setSwipedConversation(null)
      setSwipeDirection(null)
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
  }

  // Handle mute/unmute conversation
  const handleMuteConversation = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Toggle mute status
      const newMuteStatus = !isMuted
      
      // Update conversation muted status (assuming conversations table has a muted_by_user_ids array or similar)
      // For now, we'll use a user_preferences table or add muted field
      const { error } = await supabase
        .from('conversations')
        .update({ muted: newMuteStatus })
        .eq('id', conversationId)

      if (error) {
        // If muted field doesn't exist, try creating a user_conversation_preferences table entry
        // For now, we'll use localStorage as fallback
        const mutedConversations = JSON.parse(localStorage.getItem('muted_conversations') || '[]')
        if (newMuteStatus) {
          if (!mutedConversations.includes(conversationId)) {
            mutedConversations.push(conversationId)
          }
        } else {
          const index = mutedConversations.indexOf(conversationId)
          if (index > -1) {
            mutedConversations.splice(index, 1)
          }
        }
        localStorage.setItem('muted_conversations', JSON.stringify(mutedConversations))
      }

      setIsMuted(newMuteStatus)
      setShowMenu(false)
    } catch (error) {
      console.error('Error muting conversation:', error)
    }
  }

  // Check if conversation is muted on load
  useEffect(() => {
    if (selectedConversation) {
      const mutedConversations = JSON.parse(localStorage.getItem('muted_conversations') || '[]')
      setIsMuted(mutedConversations.includes(selectedConversation))
    }
  }, [selectedConversation])

  // Handle edit mode - select/deselect messages
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  // Delete selected messages
  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return

    if (!confirm(`Delete ${selectedMessages.size} message(s)? This cannot be undone.`)) {
      return
    }

    try {
      const messageIds = Array.from(selectedMessages)
      const { error } = await supabase
        .from('messages')
        .delete()
        .in('id', messageIds)

      if (error) {
        console.error('Error deleting messages:', error)
        alert('Failed to delete messages. Please try again.')
        return
      }

      // Remove deleted messages from state
      setMessages(prev => prev.filter(m => !selectedMessages.has(m.id)))
      setSelectedMessages(new Set())
      setIsEditMode(false)
    } catch (error) {
      console.error('Error deleting messages:', error)
      alert('Failed to delete messages. Please try again.')
    }
  }

  // Handle invite to group
  const handleInviteToGroup = () => {
    if (!selectedConversation) return
    
    const conversation = conversations.find(c => c.id === selectedConversation)
    if (!conversation) return

    // Navigate to groups page with the user ID as a parameter
    const otherUserId = conversation.other_user.id
    router.push(`/groups?invite=${otherUserId}`)
    setShowMenu(false)
  }

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Delete this conversation? This action cannot be undone.')) {
      return
    }

    try {
      // Delete all messages in conversation
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (messagesError) {
        console.error('Error deleting messages:', messagesError)
        return
      }

      // Delete conversation
      const { error: conversationError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (conversationError) {
        console.error('Error deleting conversation:', conversationError)
        return
      }

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
        setMessages([])
      }

      // Trigger unread count update
      window.dispatchEvent(new CustomEvent('message_read'))
      
      setSwipedConversation(null)
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent, conversationId: string) => {
    if (e.targetTouches?.[0]) {
      setTouchStart(e.targetTouches[0].clientX)
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent, conversationId: string) => {
    if (e.targetTouches?.[0]) {
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const handleTouchEnd = (conversationId: string) => {
    const swipeDistance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (swipeDistance > minSwipeDistance) {
      // Swiped left - show delete
      setSwipedConversation(conversationId)
      setSwipeDirection('left')
    } else if (swipeDistance < -minSwipeDistance) {
      // Swiped right - show archive
      setSwipedConversation(conversationId)
      setSwipeDirection('right')
    } else {
      // Reset if swipe wasn't far enough
      setSwipedConversation(null)
      setSwipeDirection(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <MessagesLoadingSkeleton />
      </div>
    )
  }

  if (isVideoCallActive && currentCallUser && selectedConversation && currentUserId) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">Loading video call...</div></div>}>
        <LazyVideoCall
          conversationId={selectedConversation}
          currentUserId={currentUserId}
          otherUserId={currentCallUser.id}
          otherUserName={currentCallUser.name}
          onEndCall={endVideoCall}
        />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between">
                  <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-lime-400">Messages</h1>
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-white/60">
                {isConnected ? 'Real-time' : 'Offline'}
              </span>
            </div>
            {/* Debug Notification Button */}
            <button
              onClick={debugNotifications}
              className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300 rounded-lg"
              title="Test Notifications"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="pt-20 flex flex-col md:flex-row h-screen">
        {/* Conversations List - Hidden on mobile when conversation selected */}
        <div className={`w-full md:w-1/3 md:border-r border-white/10 bg-black/50 md:h-full overflow-y-auto ${selectedConversation ? 'hidden md:block' : 'block'}`}>
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
                    className="relative overflow-hidden"
                  >
                    {/* Swipeable conversation card */}
                    <div
                      onClick={() => {
                        if (!swipedConversation) {
                          setSelectedConversation(conversation.id)
                        }
                      }}
                      onTouchStart={(e) => handleTouchStart(e, conversation.id)}
                      onTouchMove={(e) => handleTouchMove(e, conversation.id)}
                      onTouchEnd={() => handleTouchEnd(conversation.id)}
                      className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedConversation === conversation.id
                          ? 'bg-lime-400/20 border border-lime-400/30'
                          : 'bg-white/5 hover:bg-white/10'
                      } ${
                        swipedConversation === conversation.id && swipeDirection === 'left'
                          ? 'translate-x-[-80px]' 
                          : swipedConversation === conversation.id && swipeDirection === 'right'
                          ? 'translate-x-[80px]'
                          : 'translate-x-0'
                      }`}
                      style={{ transition: 'transform 0.3s ease' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={conversation.other_user.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23222" width="100" height="100"/%3E%3Ctext fill="%23aaa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"%3E?%3C/text%3E%3C/svg%3E'}
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
                            <div className="flex justify-end mt-1">
                              <span className="bg-lime-400 text-black text-xs px-2 py-1 rounded-full font-semibold">
                                {conversation.unread_count}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete button revealed by left swipe */}
                    {swipedConversation === conversation.id && swipeDirection === 'left' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conversation.id)
                          setSwipedConversation(null)
                          setSwipeDirection(null)
                      }}
                        className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center rounded-r-xl z-10"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    )}

                    {/* Archive button revealed by right swipe */}
                    {swipedConversation === conversation.id && swipeDirection === 'right' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchiveConversation(conversation.id)
                        }}
                        className="absolute left-0 top-0 bottom-0 w-20 bg-blue-500 flex items-center justify-center rounded-l-xl z-10"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area - Show on mobile when conversation selected */}
        <div className={`flex-1 flex flex-col min-h-0 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="relative border-b border-white/10 p-4 bg-black/50 backdrop-blur-sm sticky top-20 z-40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Back button for mobile */}
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {conversations.find(c => c.id === selectedConversation)?.other_user && (
                      <button
                        onClick={() => {
                          const conversation = conversations.find(c => c.id === selectedConversation)
                          if (conversation) {
                            router.push(`/profile/${conversation.other_user.id}`)
                          }
                        }}
                        className="flex-shrink-0 hover:opacity-80 transition-opacity duration-200 rounded-full"
                        title="View Profile"
                      >
                        <img
                          src={conversations.find(c => c.id === selectedConversation)?.other_user.photo || ''}
                          alt={conversations.find(c => c.id === selectedConversation)?.other_user.display_name || ''}
                          className="w-10 h-10 rounded-full object-cover cursor-pointer"
                        />
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {conversations.find(c => c.id === selectedConversation)?.other_user.display_name || 'Unknown'}
                      </h3>
                      {conversations.find(c => c.id === selectedConversation)?.other_user.online && (
                        <p className="text-green-400 text-xs">Online</p>
                      )}
                    </div>
                    {/* Call buttons next to name */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Regular call button */}
                      <button
                        onClick={() => {
                          // TODO: Implement voice call
                          console.log('Voice call clicked')
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        title="Voice Call"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      {/* Video call button */}
                    <button
                      onClick={startVideoCall}
                        className="p-2 bg-lime-400 rounded-lg hover:scale-110 transition-all duration-300"
                      title="Start Video Call"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Sandwich menu button with relative positioning for dropdown */}
                    <div className="relative" data-menu>
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        title="Menu"
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      
                      {/* Menu Dropdown - positioned relative to sandwich button */}
                      {showMenu && (
                        <div 
                          data-menu 
                          className="absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 z-50 min-w-[200px] shadow-2xl animate-[fadeInDown_0.2s_ease-out]"
                        >
                  <button
                    onClick={() => {
                      const conversation = conversations.find(c => c.id === selectedConversation)
                      if (conversation) {
                        router.push(`/profile/${conversation.other_user.id}`)
                      }
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg text-sm"
                  >
                    👤 View Profile
                  </button>
                  <button
                    onClick={() => {
                      handleMuteConversation(selectedConversation!)
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg text-sm"
                  >
                    {isMuted ? '🔊 Unmute' : '🔇 Mute'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditMode(true)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      handleInviteToGroup()
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg text-sm"
                  >
                    👥 Invite to Group
                  </button>
                  <button
                    onClick={() => {
                      handleArchiveConversation(selectedConversation!)
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-lg text-sm"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this conversation?')) {
                        handleDeleteConversation(selectedConversation!)
                      }
                      setShowMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg text-sm"
                  >
                    Delete Chat
                  </button>
                        </div>
                      )}
              </div>
                    
                    {/* X button */}
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                      title="Close"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit Mode Header */}
              {isEditMode && (
                <div className="border-b border-white/10 p-4 bg-black/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsEditMode(false)
                        setSelectedMessages(new Set())
                      }}
                      className="px-4 py-2 text-white hover:bg-white/10 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                    <span className="text-white/60 text-sm">
                      {selectedMessages.size} selected
                    </span>
                  </div>
                  <button
                    onClick={handleDeleteSelectedMessages}
                    disabled={selectedMessages.size === 0}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm"
                  >
                    Delete ({selectedMessages.size})
                  </button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isSelected = selectedMessages.has(message.id)
                  const isOtherUser = message.sender_id === (conversations.find(c => c.id === selectedConversation)?.other_user.id)
                  
                  return (
                  <div
                    key={message.id}
                      className={`flex ${isOtherUser ? 'justify-start' : 'justify-end'}`}
                  >
                      <div
                        onClick={() => {
                          if (isEditMode) {
                            toggleMessageSelection(message.id)
                          }
                        }}
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl cursor-pointer transition-all ${
                          isEditMode && isSelected
                            ? 'ring-2 ring-lime-400 ring-offset-2 ring-offset-black'
                            : ''
                        } ${
                          isOtherUser
                        ? 'bg-white/10 text-white'
                        : 'bg-lime-400 text-black'
                        } ${isEditMode ? 'hover:opacity-80' : ''}`}
                      >
                        {isEditMode && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-lime-400 border-lime-400'
                                : 'border-white/40'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
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
                  )
                })}
                
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
                          <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
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
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-300"
                    disabled={sending}
                  />
                  {/* Video Call Button */}
                  <button
                    type="button"
                    onClick={startVideoCall}
                    className="p-3 bg-lime-400 rounded-xl hover:scale-110 transition-all duration-300 shadow-lg shadow-lime-400/30 flex items-center justify-center"
                    title="Start Video Call"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-3 bg-lime-400 text-black rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
