'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SavedPhrase {
  id: string
  phrase: string
  order_index: number
}

interface SavedPhrasesPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (phrase: string) => void
}

export default function SavedPhrasesPicker({
  isOpen,
  onClose,
  onSelect
}: SavedPhrasesPickerProps) {
  const [phrases, setPhrases] = useState<SavedPhrase[]>([])
  const [loading, setLoading] = useState(false)
  const [newPhrase, setNewPhrase] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadPhrases()
    }
  }, [isOpen])

  const loadPhrases = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('saved_phrases')
        .select('id, phrase, order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading saved phrases:', error)
        return
      }

      setPhrases(data || [])
    } catch (err) {
      console.error('Error loading saved phrases:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPhrase = async () => {
    if (!newPhrase.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('saved_phrases')
        .insert({
          user_id: user.id,
          phrase: newPhrase.trim(),
          order_index: phrases.length
        })

      if (error) {
        console.error('Error adding phrase:', error)
        return
      }

      setNewPhrase('')
      setShowAddForm(false)
      loadPhrases()
    } catch (err) {
      console.error('Error adding phrase:', err)
    }
  }

  const handleDeletePhrase = async (phraseId: string) => {
    try {
      const { error } = await supabase
        .from('saved_phrases')
        .delete()
        .eq('id', phraseId)

      if (error) {
        console.error('Error deleting phrase:', error)
        return
      }

      loadPhrases()
    } catch (err) {
      console.error('Error deleting phrase:', err)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl z-50 animate-[slideUp_0.3s_ease-out] shadow-2xl max-h-[70vh] flex flex-col">
        <div className="p-4">
          {/* Handle bar */}
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Saved Phrases</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-lime-400 text-black rounded-xl font-semibold hover:scale-105 transition-all"
            >
              {showAddForm ? 'Cancel' : '+ Add'}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-4 p-4 bg-white/5 rounded-xl">
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Enter a phrase to save..."
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400 mb-3"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPhrase()
                  }
                }}
              />
              <button
                onClick={handleAddPhrase}
                className="w-full px-4 py-2 bg-lime-400 text-black rounded-xl font-semibold hover:scale-105 transition-all"
              >
                Save Phrase
              </button>
            </div>
          )}
        </div>

        {/* Phrases List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="text-center py-8 text-white/60">Loading...</div>
          ) : phrases.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No saved phrases yet. Add one to get started!
            </div>
          ) : (
            <div className="space-y-2">
              {phrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  <button
                    onClick={() => {
                      onSelect(phrase.phrase)
                      onClose()
                    }}
                    className="flex-1 text-left text-white"
                  >
                    {phrase.phrase}
                  </button>
                  <button
                    onClick={() => handleDeletePhrase(phrase.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                    title="Delete phrase"
                  >
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}

