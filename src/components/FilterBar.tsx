'use client'

import { useState } from 'react'

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
    <div className="flex gap-2 overflow-x-auto p-4 no-scrollbar">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => toggleFilter(filter.id)}
          className={`glass-bubble px-4 py-2 text-sm font-medium transition-all duration-300 ${
            activeFilters.includes(filter.id) 
              ? 'active' 
              : 'hover:bg-white/10'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
