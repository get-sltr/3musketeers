'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { createClient } from '@/lib/supabase/client'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (conversationId: string, content: string, messageType?: string, fileUrl?: string) => void
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  markMessageRead: (messageId: string, conversationId: string) => void
  shareFile: (conversationId: string, fileName: string, fileType: string, fileSize: number) => void
  updateLocation: (conversationId: string, latitude: number, longitude: number) => void
  startVideoCall: (targetUserId: string, conversationId: string, offer: RTCSessionDescriptionInit) => void
  answerVideoCall: (targetUserId: string, answer: RTCSessionDescriptionInit) => void
  sendIceCandidate: (targetUserId: string, candidate: RTCIceCandidateInit) => void
  endVideoCall: (targetUserId: string, conversationId: string) => void
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('https://3musketeers-production.up.railway.app', {
      transports: ['websocket', 'polling'],
      autoConnect: false
    })

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Connected to real-time backend')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from real-time backend')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  // Authenticate with the backend
  useEffect(() => {
    if (socket && isConnected) {
      const authenticate = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            socket.emit('authenticate', {
              userId: session.user.id,
              token: session.access_token
            })
          }
        } catch (error) {
          console.error('Authentication error:', error)
        }
      }
      authenticate()
    }
  }, [socket, isConnected, supabase])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    // Message handlers
    socket.on('new_message', (data) => {
      console.log('New message received:', data)
      // Handle new message - you can emit a custom event or update state
      window.dispatchEvent(new CustomEvent('new_message', { detail: data }))
    })

    socket.on('message_delivered', (data) => {
      console.log('Message delivered:', data)
      window.dispatchEvent(new CustomEvent('message_delivered', { detail: data }))
    })

    socket.on('message_read', (data) => {
      console.log('Message read:', data)
      window.dispatchEvent(new CustomEvent('message_read', { detail: data }))
    })

    // Typing indicators
    socket.on('user_typing', (data) => {
      console.log('User typing:', data)
      window.dispatchEvent(new CustomEvent('user_typing', { detail: data }))
    })

    socket.on('user_stop_typing', (data) => {
      console.log('User stopped typing:', data)
      window.dispatchEvent(new CustomEvent('user_stop_typing', { detail: data }))
    })

    // User presence
    socket.on('user_online', (data) => {
      console.log('User online:', data)
      window.dispatchEvent(new CustomEvent('user_online', { detail: data }))
    })

    socket.on('user_offline', (data) => {
      console.log('User offline:', data)
      window.dispatchEvent(new CustomEvent('user_offline', { detail: data }))
    })

    // WebRTC signaling
    socket.on('call_offer', (data) => {
      console.log('Call offer received:', data)
      window.dispatchEvent(new CustomEvent('call_offer', { detail: data }))
    })

    socket.on('call_answer', (data) => {
      console.log('Call answer received:', data)
      window.dispatchEvent(new CustomEvent('call_answer', { detail: data }))
    })

    socket.on('call_ice_candidate', (data) => {
      console.log('ICE candidate received:', data)
      window.dispatchEvent(new CustomEvent('call_ice_candidate', { detail: data }))
    })

    socket.on('call_end', (data) => {
      console.log('Call ended:', data)
      window.dispatchEvent(new CustomEvent('call_end', { detail: data }))
    })

    // Location updates
    socket.on('user_location_update', (data) => {
      console.log('Location update:', data)
      window.dispatchEvent(new CustomEvent('user_location_update', { detail: data }))
    })

    // File sharing
    socket.on('file_shared', (data) => {
      console.log('File shared:', data)
      window.dispatchEvent(new CustomEvent('file_shared', { detail: data }))
    })

    return () => {
      // Remove all event listeners
      socket.off('new_message')
      socket.off('message_delivered')
      socket.off('message_read')
      socket.off('user_typing')
      socket.off('user_stop_typing')
      socket.off('user_online')
      socket.off('user_offline')
      socket.off('call_offer')
      socket.off('call_answer')
      socket.off('call_ice_candidate')
      socket.off('call_end')
      socket.off('user_location_update')
      socket.off('file_shared')
    }
  }, [socket])

  // Socket action functions
  const sendMessage = (conversationId: string, content: string, messageType: string = 'text', fileUrl?: string) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        conversationId,
        content,
        messageType,
        fileUrl
      })
    }
  }

  const startTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { conversationId })
    }
  }

  const stopTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { conversationId })
    }
  }

  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join_conversation', { conversationId })
    }
  }

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_conversation', { conversationId })
    }
  }

  const markMessageRead = (messageId: string, conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_message_read', { messageId, conversationId })
    }
  }

  const shareFile = (conversationId: string, fileName: string, fileType: string, fileSize: number) => {
    if (socket && isConnected) {
      socket.emit('file_share', { conversationId, fileName, fileType, fileSize })
    }
  }

  const updateLocation = (conversationId: string, latitude: number, longitude: number) => {
    if (socket && isConnected) {
      socket.emit('location_update', { conversationId, latitude, longitude })
    }
  }

  const startVideoCall = (targetUserId: string, conversationId: string, offer: RTCSessionDescriptionInit) => {
    if (socket && isConnected) {
      socket.emit('call_offer', { targetUserId, conversationId, offer })
    }
  }

  const answerVideoCall = (targetUserId: string, answer: RTCSessionDescriptionInit) => {
    if (socket && isConnected) {
      socket.emit('call_answer', { targetUserId, answer })
    }
  }

  const sendIceCandidate = (targetUserId: string, candidate: RTCIceCandidateInit) => {
    if (socket && isConnected) {
      socket.emit('call_ice_candidate', { targetUserId, candidate })
    }
  }

  const endVideoCall = (targetUserId: string, conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('call_end', { targetUserId, conversationId })
    }
  }

  return {
    socket,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    markMessageRead,
    shareFile,
    updateLocation,
    startVideoCall,
    answerVideoCall,
    sendIceCandidate,
    endVideoCall
  }
}
