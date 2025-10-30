'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface PositionFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (positions: string[]) => void
  currentPositions?: string[]
}

const POSITIONS = [
  { value: 'Top', label: 'Top ↑', icon: '↑' },
  { value: 'Vers Top', label: 'Vers Top ↗', icon: '↗' },
  { value: 'Versatile', label: 'Versatile ↕', icon: '↕' },
  { value: 'Vers Bottom', label: 'Vers Bottom ↙', icon: '↙' },
  { value: 'Bottom', label: 'Bottom ↓', icon: '↓' },
  { value: 'Side', label: 'Side ↔', icon: '↔' },
  { value: 'Not Specified', label: 'Not Specified', icon: '?' }
]

export default function PositionFilterModal({ 
  isOpen, 
  onClose, 
  onApply, 
  currentPositions = [] 
}: PositionFilterModalProps) {
  const [selectedPositions, setSelectedPositions] = useState<string[]>(currentPositions)

  const togglePosition = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position)
        ? prev.filter(p => p !== position)
        : [...prev, position]
    )
  }

  const handleApply = () => {
    onApply(selectedPositions)
    onClose()
  }

  const handleSelectAll = () => {
    setSelectedPositions(POSITIONS.map(p => p.value))
  }

  const handleClearAll = () => {
    setSelectedPositions([])
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter by Position">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {POSITIONS.map(position => (
            <button
              key={position.value}
              onClick={() => togglePosition(position.value)}
              className={`p-4 rounded-2xl border transition-all ${
                selectedPositions.includes(position.value)
                  ? 'bg-cyan-500/20 border-cyan-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-white font-semibold text-lg">{position.icon}</div>
              <div className="text-white/80 text-sm">{position.label}</div>
            </button>
          ))}
        </div>

        {selectedPositions.length > 0 && (
          <div className="glass-bubble p-4 bg-cyan-500/10 border border-cyan-500/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {selectedPositions.length}
              </div>
              <div className="text-white/60 text-sm">
                Position{selectedPositions.length > 1 ? 's' : ''} Selected
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="flex-1 glass-bubble py-2 rounded-xl text-white/80 text-sm font-medium hover:bg-white/10 transition-all duration-300"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="flex-1 glass-bubble py-2 rounded-xl text-white/80 text-sm font-medium hover:bg-white/10 transition-all duration-300"
          >
            Clear All
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 glass-bubble py-3 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 py-3 rounded-2xl text-white font-semibold hover:scale-105 transition-all duration-300"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </Modal>
  )
}


