'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface AgeFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (minAge: number, maxAge: number) => void
  currentMin?: number
  currentMax?: number
}

export default function AgeFilterModal({ 
  isOpen, 
  onClose, 
  onApply, 
  currentMin = 18, 
  currentMax = 65 
}: AgeFilterModalProps) {
  const [minAge, setMinAge] = useState(currentMin)
  const [maxAge, setMaxAge] = useState(currentMax)

  const handleApply = () => {
    onApply(minAge, maxAge)
    onClose()
  }

  const handleReset = () => {
    setMinAge(18)
    setMaxAge(65)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter by Age">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Minimum Age: {minAge}
            </label>
            <input
              type="range"
              min="18"
              max="80"
              value={minAge}
              onChange={(e) => setMinAge(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Maximum Age: {maxAge}
            </label>
            <input
              type="range"
              min="18"
              max="80"
              value={maxAge}
              onChange={(e) => setMaxAge(parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        <div className="glass-bubble p-4 bg-cyan-500/10 border border-cyan-500/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {minAge} - {maxAge}
            </div>
            <div className="text-white/60 text-sm">Age Range</div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 glass-bubble py-3 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all duration-300"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 py-3 rounded-2xl text-white font-semibold hover:scale-105 transition-all duration-300"
          >
            Apply Filter
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #ff00ff);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #ff00ff);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
        }
      `}</style>
    </Modal>
  )
}


