'use client'

import { useState, useRef, useEffect } from 'react'

interface BlazeAIProps {
  conversationId: string
  onAIMessage: (message: string) => void
}

export default function BlazeAI({ conversationId, onAIMessage }: BlazeAIProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [aiHistory, setAiHistory] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // AI-powered conversation starters
  const conversationStarters = [
    "Hey! I noticed we have similar interests. What's your favorite hobby?",
    "Your profile caught my attention! What's the best part of your day?",
    "I see you're into [interest]. I love that too! What got you started?",
    "Your photos are amazing! Where was that taken?",
    "I noticed we're both [trait]. What's your take on [topic]?",
    "Your bio is really interesting! Tell me more about [mention].",
    "I see you're looking for [preference]. I'm curious about your experience with that.",
    "Your style is great! Where do you get your inspiration from?",
    "I noticed we're both into [activity]. What's your favorite part about it?",
    "Your energy in your photos is contagious! What makes you happiest?"
  ]

  // AI-powered profile suggestions
  const profileSuggestions = [
    "Add more details about your interests to attract like-minded people",
    "Your bio could be more engaging - try adding a fun fact about yourself",
    "Consider adding photos that show your personality and hobbies",
    "Your profile is great, but more photos would help people connect with you",
    "Try adding what you're looking for to help people understand your goals",
    "Your interests section could be more specific to help with matching",
    "Consider adding your favorite activities to help people start conversations",
    "Your profile is solid, but a fun ice-breaker question could help",
    "Try adding what makes you unique to stand out from the crowd",
    "Your profile is good, but more personal details would help people connect"
  ]

  const handleAISend = async () => {
    if (!aiMessage.trim() || isThinking) return

    setIsThinking(true)
    setAiHistory(prev => [...prev, `You: ${aiMessage}`])

    try {
      // Simulate AI thinking (replace with actual Perplexity API call)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate AI response based on message type
      let aiResponse = ''
      
      if (aiMessage.toLowerCase().includes('profile')) {
        aiResponse = profileSuggestions[Math.floor(Math.random() * profileSuggestions.length)] || "Here are some profile tips to help you stand out..."
      } else if (aiMessage.toLowerCase().includes('conversation') || aiMessage.toLowerCase().includes('message')) {
        aiResponse = conversationStarters[Math.floor(Math.random() * conversationStarters.length)] || "Here's a great conversation starter..."
      } else if (aiMessage.toLowerCase().includes('match') || aiMessage.toLowerCase().includes('compatible')) {
        aiResponse = "Based on your profile and preferences, I'd suggest looking for people who share your interests in [activity] and have similar values. Try focusing on profiles that mention [interest] and seem to have a similar lifestyle."
      } else {
        aiResponse = "I'm here to help you make meaningful connections! I can help you improve your profile, suggest conversation starters, or give advice on finding compatible matches. What would you like help with?"
      }

      setAiHistory(prev => [...prev, `Blaze AI: ${aiResponse}`])
      setAiMessage('')
    } catch (error) {
      console.error('AI error:', error)
      setAiHistory(prev => [...prev, `Blaze AI: Sorry, I'm having trouble thinking right now. Try again in a moment!`])
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
      {/* Blaze AI Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-40 p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2"
      >
        <div className="text-2xl">🔥</div>
        <span className="font-bold">Blaze AI</span>
      </button>

      {/* Blaze AI Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 h-96 bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🔥</div>
              <div>
                <h3 className="text-white font-bold">Blaze AI</h3>
                <p className="text-xs text-white/60">Powered by Perplexity</p>
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
                <div className="text-4xl mb-2">🔥</div>
                <p>Hi! I'm Blaze AI, your personal connection assistant.</p>
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
                  {message.replace('You: ', '').replace('Blaze AI: ', '')}
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
                    <span>Blaze AI is thinking...</span>
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
                placeholder="Ask Blaze AI anything..."
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 resize-none"
                rows={2}
                disabled={isThinking}
              />
              <button
                onClick={handleAISend}
                disabled={!aiMessage.trim() || isThinking}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
