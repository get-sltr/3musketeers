'use client'

import { useState, useRef, useEffect } from 'react'
import { erosAPI } from '@/lib/eros-api'

interface ErosAIProps {
  conversationId: string
  onAIMessage: (message: string) => void
}

export default function ErosAI({ conversationId, onAIMessage }: ErosAIProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [aiHistory, setAiHistory] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Draggable mini button position (AssistiveTouch style)
  const [pos, setPos] = useState<{x:number;y:number} | null>(null)
  const draggingRef = useRef<{dx:number;dy:number} | null>(null)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('eros_ai_button_position') : null
    const init = () => {
      const size = 56
      const x = window.innerWidth - size - 16
      const y = window.innerHeight - size - 96 // keep above input bar
      setPos(saved ? JSON.parse(saved) : { x, y })
    }
    init()
    const onResize = () => init()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const touch = (e as any).touches?.[0]
    const clientX = touch ? touch.clientX : (e as any).clientX
    const clientY = touch ? touch.clientY : (e as any).clientY
    if (!pos) return
    draggingRef.current = { dx: clientX - pos.x, dy: clientY - pos.y }
    e.preventDefault()
  }
  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingRef.current) return
    const touch = (e as any).touches?.[0]
    const clientX = touch ? touch.clientX : (e as any).clientX
    const clientY = touch ? touch.clientY : (e as any).clientY
    const size = 56
    const x = Math.min(Math.max(8, clientX - draggingRef.current.dx), window.innerWidth - size - 8)
    const y = Math.min(Math.max(8, clientY - draggingRef.current.dy), window.innerHeight - size - 8)
    setPos({ x, y })
  }
  const onDragEnd = () => {
    draggingRef.current = null
    if (pos) localStorage.setItem('eros_ai_button_position', JSON.stringify(pos))
  }

  const handleAISend = async () => {
    if (!aiMessage.trim() || isThinking) return

    const userMessage = aiMessage.trim()
    setIsThinking(true)
    setAiHistory(prev => [...prev, `You: ${userMessage}`])
    setAiMessage('')

    try {
      // Call the real EROS API
      const response = await erosAPI.chat(userMessage, { 
        context: 'chat_widget',
        conversationId 
      })
      
      const aiResponse = response.response || "I'm having trouble responding right now. Please try again."
      setAiHistory(prev => [...prev, `EROS: ${aiResponse}`])
    } catch (error: any) {
      console.error('AI error:', error)
      const errorMessage = error?.message || 'Could not reach EROS. Please check your connection.'
      
      if (errorMessage.includes('Authentication required')) {
        setAiHistory(prev => [...prev, `EROS: ❌ Please log in to use EROS.`])
      } else {
        setAiHistory(prev => [...prev, `EROS: ❌ Error: ${errorMessage}`])
      }
    } finally {
      setIsThinking(false)
    }
  }

  const handleQuickAction = (action: string) => {
    setAiMessage(action)
    handleAISend()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAISend()
    }
  }

  return (
    <>
      {/* EROS floating mini button (draggable) */}
      {pos && (
        <div
          className="fixed z-40 select-none"
          style={{ left: pos.x, top: pos.y, width: 56, height: 56 }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <button
            aria-label="Open EROS Assistant"
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl flex items-center justify-center text-2xl hover:bg-white/15 active:scale-95 transition"
          >
            🏹
          </button>
        </div>
      )}

      {/* EROS Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-96 h-96 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🏹</div>
              <div>
                <h3 className="text-white font-bold">EROS AI</h3>
                <p className="text-xs text-white/60">Powered by Claude AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {aiHistory.length === 0 && (
              <div className="text-center text-white/60 text-sm">
                <div className="text-4xl mb-2">🏹</div>
                <p>Hi! I'm EROS, your personal connection assistant.</p>
                <p className="mt-2">I can help you with profiles, conversations, and finding matches!</p>
              </div>
            )}
            
            {aiHistory.map((message, index) => (
              <div key={index} className={`${message.startsWith('You:') ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-xs px-3 py-2 rounded-2xl text-sm ${
                  message.startsWith('You:') 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' 
                    : 'bg-white/10 text-white'
                }`}>
                  {message.replace('You: ', '').replace('EROS: ', '')}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="text-left">
                <div className="inline-block bg-white/10 text-white px-3 py-2 rounded-2xl text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span>EROS is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-2 border-t border-white/10">
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => handleQuickAction('Help me improve my profile')}
                className="px-3 py-1 bg-white/10 text-white text-xs rounded-full hover:bg-white/20 transition-colors"
              >
                📝 Profile Help
              </button>
              <button
                onClick={() => handleQuickAction('Give me conversation starters')}
                className="px-3 py-1 bg-white/10 text-white text-xs rounded-full hover:bg-white/20 transition-colors"
              >
                💬 Starters
              </button>
              <button
                onClick={() => handleQuickAction('Find compatible matches')}
                className="px-3 py-1 bg-white/10 text-white text-xs rounded-full hover:bg-white/20 transition-colors"
              >
                💕 Matches
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask EROS anything..."
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 resize-none"
                rows={2}
                disabled={isThinking}
              />
              <button
                onClick={handleAISend}
                disabled={!aiMessage.trim() || isThinking}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🏹
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
