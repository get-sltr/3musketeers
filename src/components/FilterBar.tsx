'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MicroInteractions, { InteractiveButton } from './MicroInteractions'

interface FilterBarProps {
  onFilterChange?: (filters: any) => void
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showAgeModal, setShowAgeModal] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [ageRange, setAgeRange] = useState({ min: 18, max: 99 })
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])

  const filters = [
    { id: 'online', label: 'Online' },
    { id: 'dtfn', label: '⚡ DTFN' },
    { id: 'party', label: '🥳 Party' },
    { id: 'age', label: 'Age' },
    { id: 'position', label: 'Position' },
  ]

  const toggleFilter = (filterId: string) => {
    if (filterId === 'age') {
      setShowAgeModal(true)
      return
    }
    if (filterId === 'position') {
      setShowPositionModal(true)
      return
    }
    
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(id => id !== filterId)
      : [...activeFilters, filterId]
    
    setActiveFilters(newFilters)
    onFilterChange?.({ filters: newFilters, ageRange, positions: selectedPositions })
  }

  const applyAgeFilter = () => {
    const newFilters = [...activeFilters.filter(f => f !== 'age'), 'age']
    setActiveFilters(newFilters)
    setShowAgeModal(false)
    onFilterChange?.({ filters: newFilters, ageRange, positions: selectedPositions })
  }

  const applyPositionFilter = () => {
    const newFilters = [...activeFilters.filter(f => f !== 'position'), 'position']
    setActiveFilters(newFilters)
    setShowPositionModal(false)
    onFilterChange?.({ filters: newFilters, ageRange, positions: selectedPositions })
  }

  const togglePosition = (position: string) => {
    setSelectedPositions(prev => 
      prev.includes(position) 
        ? prev.filter(p => p !== position)
        : [...prev, position]
    )
  }

  return (
    <>
      <motion.div 
        className="flex gap-2 overflow-x-auto p-4 no-scrollbar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {filters.map((filter, index) => (
          <motion.div
            key={filter.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <InteractiveButton
              onClick={() => toggleFilter(filter.id)}
              variant={activeFilters.includes(filter.id) ? 'primary' : 'secondary'}
              size="small"
              className={`whitespace-nowrap ${
                activeFilters.includes(filter.id) 
                  ? 'shadow-lg shadow-cyan-500/25' 
                  : ''
              }`}
            >
              {filter.label}
            </InteractiveButton>
          </motion.div>
        ))}
      </motion.div>

      {/* Age Filter Modal */}
      <AnimatePresence>
        {showAgeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAgeModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Filter by Age</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm block mb-2">Min Age</label>
                  <input
                    type="number"
                    value={ageRange.min}
                    onChange={(e) => setAgeRange(prev => ({ ...prev, min: parseInt(e.target.value) || 18 }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white"
                    min="18"
                    max="99"
                  />
                </div>
                
                <div>
                  <label className="text-white/80 text-sm block mb-2">Max Age</label>
                  <input
                    type="number"
                    value={ageRange.max}
                    onChange={(e) => setAgeRange(prev => ({ ...prev, max: parseInt(e.target.value) || 99 }))}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white"
                    min="18"
                    max="99"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAgeModal(false)}
                    className="flex-1 glass-bubble py-3 text-white/80 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyAgeFilter}
                    className="flex-1 gradient-button py-3 text-white font-bold"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Position Filter Modal */}
      <AnimatePresence>
        {showPositionModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPositionModal(false)}
          >
            <motion.div
              className="glass-card p-6 max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Filter by Position</h3>
              
              <div className="space-y-3">
                {['Top', 'Bottom', 'Versatile', 'Side'].map(position => (
                  <button
                    key={position}
                    onClick={() => togglePosition(position)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedPositions.includes(position)
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold'
                        : 'glass-bubble text-white/80 hover:text-white'
                    }`}
                  >
                    {position}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPositionModal(false)}
                  className="flex-1 glass-bubble py-3 text-white/80 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={applyPositionFilter}
                  className="flex-1 gradient-button py-3 text-white font-bold"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
