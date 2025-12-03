'use client'

import { useState, useEffect } from 'react'

interface SavedPhrasesProps {
  isOpen: boolean
  onClose: () => void
  onPhraseSelect: (phrase: string) => void
}

interface Phrase {
  id: string
  text: string
  emoji?: string
  category: 'greeting' | 'interest' | 'meetup' | 'custom'
}

const DEFAULT_PHRASES: Phrase[] = [
  { id: '1', text: 'Hey, how are you?', emoji: '👋', category: 'greeting' },
  { id: '2', text: 'Nice to meet you!', emoji: '😊', category: 'greeting' },
  { id: '3', text: "What's up?", emoji: '🙌', category: 'greeting' },
  { id: '4', text: "You're cute!", emoji: '😍', category: 'interest' },
  { id: '5', text: 'I like your profile', emoji: '✨', category: 'interest' },
  { id: '6', text: "What are you looking for?", emoji: '🤔', category: 'interest' },
  { id: '7', text: 'Want to grab coffee?', emoji: '☕', category: 'meetup' },
  { id: '8', text: 'Free tonight?', emoji: '🌙', category: 'meetup' },
  { id: '9', text: 'Where are you located?', emoji: '📍', category: 'meetup' },
  { id: '10', text: "Let's connect!", emoji: '🔗', category: 'meetup' },
]

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '⭐' },
  { id: 'greeting', label: 'Greetings', emoji: '👋' },
  { id: 'interest', label: 'Interest', emoji: '💫' },
  { id: 'meetup', label: 'Meetup', emoji: '📍' },
  { id: 'custom', label: 'Custom', emoji: '✏️' },
]

export default function SavedPhrases({
  isOpen,
  onClose,
  onPhraseSelect
}: SavedPhrasesProps) {
  const [phrases, setPhrases] = useState<Phrase[]>(DEFAULT_PHRASES)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [isAdding, setIsAdding] = useState(false)
  const [newPhrase, setNewPhrase] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('💬')

  // Load saved phrases from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sltr_saved_phrases')
    if (saved) {
      try {
        const customPhrases = JSON.parse(saved)
        setPhrases([...DEFAULT_PHRASES, ...customPhrases])
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const filteredPhrases = activeCategory === 'all'
    ? phrases
    : phrases.filter(p => p.category === activeCategory)

  const handlePhraseClick = (phrase: Phrase) => {
    onPhraseSelect(phrase.text)
    onClose()
  }

  const handleAddPhrase = () => {
    if (!newPhrase.trim()) return

    const newPhraseObj: Phrase = {
      id: `custom_${Date.now()}`,
      text: newPhrase.trim(),
      emoji: selectedEmoji,
      category: 'custom'
    }

    const customPhrases = phrases.filter(p => p.id.startsWith('custom_'))
    const updatedCustom = [...customPhrases, newPhraseObj]

    localStorage.setItem('sltr_saved_phrases', JSON.stringify(updatedCustom))
    setPhrases([...DEFAULT_PHRASES, ...updatedCustom])

    setNewPhrase('')
    setSelectedEmoji('💬')
    setIsAdding(false)
  }

  const handleDeletePhrase = (phraseId: string) => {
    if (!phraseId.startsWith('custom_')) return

    const updatedPhrases = phrases.filter(p => p.id !== phraseId)
    const customPhrases = updatedPhrases.filter(p => p.id.startsWith('custom_'))

    localStorage.setItem('sltr_saved_phrases', JSON.stringify(customPhrases))
    setPhrases(updatedPhrases)
  }

  const quickEmojis = ['💬', '❤️', '🔥', '😘', '🥰', '😈', '🍑', '💪']

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[70vh] bg-gradient-to-b from-zinc-900/95 to-black/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 flex-shrink-0">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Saved Phrases</h3>
              <p className="text-white/40 text-sm">Quick responses</p>
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-lime-400/20 text-lime-400 rounded-xl text-sm font-medium hover:bg-lime-400/30 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-5 pb-4 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                  transition-all duration-200 flex items-center gap-1.5
                  ${activeCategory === cat.id
                    ? 'bg-lime-400 text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }
                `}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Add New Phrase Form */}
        {isAdding && (
          <div className="px-5 pb-4 flex-shrink-0">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPhrase}
                  onChange={e => setNewPhrase(e.target.value)}
                  placeholder="Type your phrase..."
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">Emoji:</span>
                <div className="flex gap-1">
                  {quickEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`
                        w-8 h-8 rounded-lg text-lg flex items-center justify-center
                        transition-all duration-150
                        ${selectedEmoji === emoji
                          ? 'bg-lime-400/30 scale-110'
                          : 'bg-white/5 hover:bg-white/10'
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 bg-white/5 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPhrase}
                  disabled={!newPhrase.trim()}
                  className="flex-1 py-2.5 bg-lime-400 text-black rounded-xl text-sm font-semibold hover:bg-lime-300 transition-all disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phrases List */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-2">
          {filteredPhrases.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-white/40">No phrases in this category</p>
            </div>
          ) : (
            filteredPhrases.map(phrase => (
              <button
                key={phrase.id}
                onClick={() => handlePhraseClick(phrase)}
                className="w-full group p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-left transition-all duration-200 flex items-center gap-3 relative"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
                  {phrase.emoji}
                </div>
                <span className="text-white text-sm flex-1">{phrase.text}</span>

                {/* Delete button for custom phrases */}
                {phrase.id.startsWith('custom_') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePhrase(phrase.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                {/* Arrow indicator */}
                <svg className="w-5 h-5 text-white/20 group-hover:text-lime-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
