'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Location } from '../utils/geohash'

interface SocketUser {
  id: string
  username: string
  display_name?: string
  latitude: number
  longitude: number
  isOnline: boolean
  party_friendly?: boolean
  dtfn?: boolean
  lastSeen: Date
}

interface UseSocketOptions {
  serverUrl?: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  nearbyUsers: SocketUser[]
  error: string | null
  connect: () => void
  disconnect: () => void
  updateLocation: (location: Location) => void
  sendMessage: (toUserId: string, message: string) => void
}

/**
 * Custom hook for real-time location updates via Socket.io
 * Handles connection, location sharing, and nearby user discovery
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001',
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options

  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [nearbyUsers, setNearbyUsers] = useState<SocketUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const reconnectCount = useRef(0)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

  const connect = () => {
    if (socket?.connected) return

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: reconnectAttempts,
      reconnectionDelay: reconnectDelay
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
      setError(null)
      reconnectCount.current = 0
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
      
      // Auto-reconnect on unexpected disconnection
      if (reason === 'io server disconnect') {
        setError('Server disconnected. Attempting to reconnect...')
        attemptReconnect()
      }
    })

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      setError(`Connection failed: ${err.message}`)
      attemptReconnect()
    })

    // Location-based events
    newSocket.on('nearby_users', (users: SocketUser[]) => {
      setNearbyUsers(users)
    })

    newSocket.on('user_location_update', (user: SocketUser) => {
      setNearbyUsers(prev => {
        const existing = prev.find(u => u.id === user.id)
        if (existing) {
          return prev.map(u => u.id === user.id ? { ...u, ...user } : u)
        } else {
          return [...prev, user]
        }
      })
    })

    newSocket.on('user_disconnected', (userId: string) => {
      setNearbyUsers(prev => prev.filter(u => u.id !== userId))
    })

    // Message events
    newSocket.on('message_received', (data: { from: string; message: string; timestamp: Date }) => {
      // Handle incoming messages
      console.log('Message received:', data)
    })

    setSocket(newSocket)
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
  }

  const attemptReconnect = () => {
    if (reconnectCount.current >= reconnectAttempts) {
      setError('Max reconnection attempts reached')
      return
    }

    reconnectCount.current++
    setError(`Reconnecting... (${reconnectCount.current}/${reconnectAttempts})`)
    
    reconnectTimeout.current = setTimeout(() => {
      connect()
    }, reconnectDelay * reconnectCount.current)
  }

  const updateLocation = (location: Location) => {
    if (socket?.connected) {
      socket.emit('location_update', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date()
      })
    }
  }

  const sendMessage = (toUserId: string, message: string) => {
    if (socket?.connected) {
      socket.emit('send_message', {
        to: toUserId,
        message,
        timestamp: new Date()
      })
    }
  }

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    socket,
    isConnected,
    nearbyUsers,
    error,
    connect,
    disconnect,
    updateLocation,
    sendMessage
  }
}

/**
 * Hook for location-based room management
 */
export function useLocationRooms(socket: Socket | null, location: Location | null) {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)

  useEffect(() => {
    if (!socket || !location) return

    // Generate room based on location (geohash-based)
    const roomId = `${Math.floor(location.latitude * 100)}_${Math.floor(location.longitude * 100)}`
    
    if (currentRoom !== roomId) {
      // Leave previous room
      if (currentRoom) {
        socket.emit('leave_room', currentRoom)
      }
      
      // Join new room
      socket.emit('join_room', roomId)
      setCurrentRoom(roomId)
    }
  }, [socket, location, currentRoom])

  return {
    currentRoom,
    joinRoom: (roomId: string) => {
      if (socket) {
        socket.emit('join_room', roomId)
        setCurrentRoom(roomId)
      }
    },
    leaveRoom: (roomId: string) => {
      if (socket) {
        socket.emit('leave_room', roomId)
        if (currentRoom === roomId) {
          setCurrentRoom(null)
        }
      }
    }
  }
}
