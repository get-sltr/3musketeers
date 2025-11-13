'use client'

import React, { useEffect, useState, useRef, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'

// --- Types ---
interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  messageType: string
  fileUrl: string | null
  createdAt: string
  senderName?: string
}

const LoadingSpinner = () => (
  <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
)

// --- Main Chat Component ---
export default function MessagesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Get conversationId from URL (e.g., /messages?conversation=...)
  const conversationId = searchParams?.get('conversation') || null

  // --- State ---
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  // Ref to scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // --- Helper: Scroll to bottom ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Effect to scroll when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // --- Helper: Fetch Message History ---
  const fetchMessages = async (convoId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Map snake_case (SQL) to camelCase (JS)
      const formattedMessages: Message[] = data.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        messageType: msg.message_type,
        fileUrl: msg.file_url,
        createdAt: msg.created_at,
      }))
      setMessages(formattedMessages)
      
    } catch (error: any) {
      toast.error('Failed to load message history.')
      console.error('Fetch messages error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Main Connection Effect ---
  useEffect(() => {
    if (!conversationId) {
      toast.error("No conversation selected.")
      return
    }

    let newSocket: Socket | null = null

    const connectAndAuthenticate = async () => {
      // 1. Get Supabase session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Not authenticated. Please log in.')
        return
      }

      const { user, access_token } = session
      setUserId(user.id)

      // 2. Connect to the Socket.io server
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
      if (!backendUrl) {
        console.error("NEXT_PUBLIC_BACKEND_URL is not set")
        toast.error("Client-server connection is not configured.")
        return
      }

      newSocket = io(backendUrl)
      setSocket(newSocket)

      // --- 3. Define Socket Event Handlers ---

      const onConnect = () => {
        console.log('Socket connected:', newSocket?.id)
        // 4. Authenticate with the server
        newSocket?.emit('authenticate', {
          userId: user.id,
          token: access_token,
        })
      }

      const onAuthenticated = () => {
        console.log('Socket authenticated!')
        setIsConnected(true)
        // 5. Join the specific conversation room
        newSocket?.emit('join_conversation', { conversationId })
        // 6. Fetch history now that we're in
        fetchMessages(conversationId)
      }

      const onNewMessage = (message: Message) => {
        // 7. Listen for new messages
        // Make sure we don't add a duplicate of our own message
        setMessages((prevMessages) => {
          if (prevMessages.find(m => m.id === message.id)) {
            return prevMessages
          }
          return [...prevMessages, message]
        })
      }

      const onAuthError = (error: { message: string }) => {
        console.error('Authentication error:', error.message)
        toast.error(`Auth Error: ${error.message}`)
        setIsConnected(false)
      }

      const onMessageError = (error: { message: string }) => {
        console.error('Message error:', error.message)
        toast.error(`Error: ${error.message}`)
      }

      const onDisconnect = () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      }

      // --- 4. Register Event Handlers ---
      newSocket.on('connect', onConnect)
      newSocket.on('authenticated', onAuthenticated)
      newSocket.on('new_message', onNewMessage)
      newSocket.on('auth_error', onAuthError)
      newSocket.on('message_error', onMessageError)
      newSocket.on('disconnect', onDisconnect)

    } // end of connectAndAuthenticate

    connectAndAuthenticate()

    // --- 5. Cleanup Function ---
    // This runs when the component unmounts
    return () => {
      if (newSocket) {
        newSocket.removeAllListeners()
        newSocket.disconnect()
        setSocket(null)
      }
    }
  }, [conversationId]) // Re-run if conversationId changes


  // --- Helper: Send Message ---
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault()
    if (!socket || !isConnected || !newMessage.trim()) return

    const content = newMessage.trim()
    
    // This is the data your backend 'send_message' event expects
    const messageData = {
      conversationId: conversationId,
      content: content,
      messageType: 'text',
      fileUrl: null
    }

    // 1. Emit the message to the server
    socket.emit('send_message', messageData)
    
    // 2. Clear the input
    setNewMessage('')
  }

  // --- Render ---

  if (!conversationId) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        No conversation selected. Go back to the grid and choose a user to message.
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Header (You can add profile pic/name here) */}
      <header className="flex items-center justify-between border-b border-gray-700 p-4">
        <h1 className="text-xl font-bold">Chat</h1>
        <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="text-center text-gray-400">
            No messages yet. Be the first to say hi!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.senderId === userId
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              {msg.content}
              <div className="text-xs opacity-60 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {/* Empty div to force scroll-to-bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="flex border-t border-gray-700 p-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="ml-4 rounded-lg bg-cyan-500 px-6 py-2 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
          disabled={!isConnected || !newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  )
}