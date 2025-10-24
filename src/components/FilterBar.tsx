'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import MicroInteractions, { InteractiveButton } from './MicroInteractions'

interface FilterBarProps {
  onFilterChange?: (filters: string[]) => void
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const filters = [
    { id: 'online', label: 'Online' },
    { id: 'dtfn', label: '⚡ DTFN' },
    { id: 'party', label: '🥳 Party' },
    { id: 'age', label: 'Age' },
    { id: 'position', label: 'Position' },
  ]

  const toggleFilter = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(id => id !== filterId)
      : [...activeFilters, filterId]
    
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  return (
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
  )
}
