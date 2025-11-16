'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

interface BlackCard {
  id: string
  code: string
  founderNumber: number
  recipientName: string
  recipientEmail: string
  customMessage: string
  created_at: string
}

export default function BlackCardGenerator() {
  const [cards, setCards] = useState<BlackCard[]>([])
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [currentCard, setCurrentCard] = useState<Partial<BlackCard>>({
    recipientName: '',
    recipientEmail: '',
    customMessage: 'Thank you for being one of the first believers. This Black Card represents lifetime access to SLTR and your place in our Founder\'s Circle. Welcome to the inner circle.',
  })
  const [generatedCount, setGeneratedCount] = useState(1)
  const cardPreviewRef = useRef<HTMLDivElement>(null)

  const generateCards = async (count: number) => {
    setGenerating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Generate cards via RPC
      const { data, error } = await supabase.rpc('generate_black_cards', {
        p_admin_id: user.id,
        p_count: count,
        p_notes: 'Batch generated via admin dashboard'
      })

      if (error) {
        console.error('Error generating cards:', error)
        alert('Failed to generate cards: ' + error.message)
        return
      }

      // Fetch all cards
      await fetchCards()
      alert(`Successfully generated ${count} black cards!`)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate cards')
    } finally {
      setGenerating(false)
    }
  }

  const fetchCards = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data, error } = await supabase.rpc('get_black_cards', {
      p_admin_id: user.id,
      p_filter: 'all'
    })

    if (!error && data) {
      const transformedCards: BlackCard[] = data.map((card: any, index: number) => ({
        id: card.id,
        code: card.code,
        founderNumber: index + 1,
        recipientName: card.claimed_by_name || '',
        recipientEmail: '',
        customMessage: card.notes || '',
        created_at: card.created_at
      }))
      setCards(transformedCards)
    }
  }

  const sendCard = async (card: BlackCard) => {
    setSending(true)
    try {
      const response = await fetch('/api/send-black-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: card.recipientEmail,
          recipientName: card.recipientName,
          code: card.code,
          founderNumber: card.founderNumber,
          customMessage: card.customMessage
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send card')
      }

      alert(`Black Card sent to ${card.recipientEmail}!`)
    } catch (error) {
      console.error('Error sending card:', error)
      alert('Failed to send card: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSending(false)
    }
  }

  const downloadCardAsImage = async (card: BlackCard) => {
    // Open the card in a new window for download
    const cardUrl = `/black-card-view?code=${card.code}&name=${encodeURIComponent(card.recipientName)}&number=${card.founderNumber}&message=${encodeURIComponent(card.customMessage)}`
    window.open(cardUrl, '_blank')
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Generate Cards Section */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">🎴 Generate Black Cards</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => generateCards(1)}
            disabled={generating}
            className="py-3 px-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-all disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate 1'}
          </button>
          <button
            onClick={() => generateCards(10)}
            disabled={generating}
            className="py-3 px-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-all disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate 10'}
          </button>
          <button
            onClick={() => generateCards(100)}
            disabled={generating}
            className="py-3 px-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-300 font-semibold hover:bg-yellow-500/30 transition-all disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate 100'}
          </button>
        </div>

        <button
          onClick={fetchCards}
          className="w-full py-2 px-4 rounded-lg bg-white/10 border border-white/20 text-white/70 text-sm hover:bg-white/20 transition-all"
        >
          ↻ Refresh Cards
        </button>
      </div>

      {/* Card Preview & Send Section */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">📧 Send Black Card</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Recipient Name</label>
            <input
              type="text"
              value={currentCard.recipientName}
              onChange={(e) => setCurrentCard({ ...currentCard, recipientName: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Recipient Email</label>
            <input
              type="email"
              value={currentCard.recipientEmail}
              onChange={(e) => setCurrentCard({ ...currentCard, recipientEmail: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Custom Message (Back of Card)</label>
            <textarea
              value={currentCard.customMessage}
              onChange={(e) => setCurrentCard({ ...currentCard, customMessage: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              placeholder="Your personal message..."
            />
            <div className="text-xs text-white/40 mt-1">{currentCard.customMessage?.length || 0}/500 characters</div>
          </div>
        </div>
      </div>

      {/* All Cards List */}
      <div className="p-6 rounded-xl bg-white/5 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">🎴 All Black Cards ({cards.length})</h3>
        
        {cards.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">🎴</div>
            <p>No cards generated yet</p>
            <p className="text-sm text-white/40">Click "Generate" above to create black cards</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-yellow-400 font-mono font-bold text-sm">{card.code}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-300">
                        #{card.founderNumber}
                      </span>
                    </div>
                    <div className="text-xs text-white/50">
                      {card.recipientName || 'Unclaimed'} · {new Date(card.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyCode(card.code)}
                      className="px-3 py-1 rounded-md bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-all"
                      title="Copy Code"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => downloadCardAsImage(card)}
                      className="px-3 py-1 rounded-md bg-white/10 text-white/70 text-xs hover:bg-white/20 transition-all"
                      title="View/Download"
                    >
                      👁️
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
