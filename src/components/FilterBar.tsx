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
              className="glass-card p-6 max-w-md w-full mx-4 rounded-3xl border border-white/10 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Filter by Age
              </h3>
              
              <div className="space-y-6">
                {/* Age Range Display */}
                <div className="glass-bubble p-5 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl">
                  <div className="text-center">
                    <div className="text-4xl font-black text-white mb-1">
                      {ageRange.min} - {ageRange.max}
                    </div>
                    <div className="text-white/60 text-sm font-medium">Age Range</div>
                  </div>
                </div>

                {/* Min Age Input */}
                <div>
                  <label className="text-white/90 text-sm font-semibold block mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Minimum Age
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={ageRange.min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 18
                        if (val >= 18 && val <= ageRange.max) {
                          setAgeRange(prev => ({ ...prev, min: val }))
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 18
                        if (val < 18) setAgeRange(prev => ({ ...prev, min: 18 }))
                        if (val > ageRange.max) setAgeRange(prev => ({ ...prev, min: ageRange.max }))
                      }}
                      className="w-full bg-black/40 border-2 border-white/20 rounded-xl px-5 py-4 text-white text-lg font-semibold focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all placeholder:text-white/30"
                      placeholder="18"
                      min="18"
                      max={ageRange.max}
                      inputMode="numeric"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">years</div>
                  </div>
                </div>
                
                {/* Max Age Input */}
                <div>
                  <label className="text-white/90 text-sm font-semibold block mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Maximum Age
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={ageRange.max}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 99
                        if (val >= ageRange.min && val <= 99) {
                          setAgeRange(prev => ({ ...prev, max: val }))
                        }
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 99
                        if (val < ageRange.min) setAgeRange(prev => ({ ...prev, max: ageRange.min }))
                        if (val > 99) setAgeRange(prev => ({ ...prev, max: 99 }))
                      }}
                      className="w-full bg-black/40 border-2 border-white/20 rounded-xl px-5 py-4 text-white text-lg font-semibold focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all placeholder:text-white/30"
                      placeholder="99"
                      min={ageRange.min}
                      max="99"
                      inputMode="numeric"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">years</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAgeModal(false)}
                    className="flex-1 glass-bubble py-3.5 rounded-xl text-white/90 font-semibold hover:bg-white/10 hover:text-white transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyAgeFilter}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 py-3.5 rounded-xl text-white font-bold hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
                  >
                    Apply Filter
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
              className="glass-card p-6 max-w-md w-full mx-4 rounded-3xl border border-white/10 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Filter by Position
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {['Top', 'Vers/Top', 'Versatile', 'Vers/Btm', 'Bottom', 'Side'].map(position => (
                  <button
                    key={position}
                    onClick={() => togglePosition(position)}
                    className={`p-4 rounded-xl text-center transition-all duration-300 border-2 ${
                      selectedPositions.includes(position)
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold border-transparent shadow-lg shadow-cyan-500/30 scale-105'
                        : 'glass-bubble text-white/80 hover:text-white border-white/10 hover:border-cyan-400/30 hover:scale-102'
                    }`}
                  >
                    <div className="text-sm font-semibold">{position}</div>
                  </button>
                ))}
              </div>

              {selectedPositions.length > 0 && (
                <div className="glass-bubble p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {selectedPositions.length}
                    </div>
                    <div className="text-white/60 text-sm">
                      Position{selectedPositions.length > 1 ? 's' : ''} Selected
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPositionModal(false)}
                  className="flex-1 glass-bubble py-3.5 rounded-xl text-white/90 font-semibold hover:bg-white/10 hover:text-white transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={applyPositionFilter}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 py-3.5 rounded-xl text-white font-bold hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300"
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
