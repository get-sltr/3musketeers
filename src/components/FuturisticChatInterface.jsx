'use client'

import { useState, useRef, useEffect } from 'react'
import { useUniversalChat } from '../hooks/useUniversalChat'

/**
 * FuturisticChatInterface - Universal chat component
 * Works for conversations, groups, and channels
 * 
 * Features:
 * - Real-time messaging via Supabase Realtime
 * - Typing indicators
 * - Message status (sending/delivered/read)
 * - Video call integration (LiveKit)
 * - File sharing
 * - Emoji reactions
 */
export default function FuturisticChatInterface({
  type = 'conversation', // 'conversation' | 'group' | 'channel'
  id = null,
  title = 'Chat',
  onVideoCall = null,
  onClose = null,
  enabled = true,
}) {
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const {
    messages,
    isLoading,
    isSending,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
  } = useUniversalChat({ type, id, enabled })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicators
  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    if (sendTypingStart && newMessage.length === 0) {
      sendTypingStart()
    }
  }

  const handleStopTyping = () => {
    if (sendTypingStop) {
      sendTypingStop()
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    handleStopTyping()

    try {
      await sendMessage(messageContent)
    } catch (error) {
      console.error('Error sending message:', error)
      // Restore message on error
      setNewMessage(messageContent)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!id) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-white/60">Select a {type} to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <h2 className="text-white font-bold text-lg">{title}</h2>
        </div>
        {onVideoCall && (
          <button
            onClick={() => onVideoCall(id)}
            className="p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl hover:scale-110 transition-all shadow-lg shadow-cyan-500/30"
            title="Start Video Call"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-white/60">No messages yet</p>
              <p className="text-white/40 text-sm mt-2">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isSent = message.sender_id === message.user_id || message.user_id === message.sender_id
            const senderName = message.profiles?.display_name || 'Unknown'
            const senderPhoto = message.profiles?.photos?.[0] || null

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isSent && senderPhoto && (
                  <img
                    src={senderPhoto}
                    alt={senderName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    isSent
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {!isSent && (
                    <p className="text-xs text-white/70 mb-1 font-semibold">{senderName}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-white/50'}`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onBlur={handleStopTyping}
              placeholder={`Message ${title}...`}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              disabled={isSending || !enabled}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || !enabled}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? '...' : 'Send'}
          </button>
        </form>
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

