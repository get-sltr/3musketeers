'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FilterBarProps {
  onFilterChange: (filters: GridFilters) => void
}

export interface GridFilters {
  tab: 'all' | 'online' | 'dtfn' | 'hosting'
  genderIdentity: string[]
  bodyTypes: string[]
  lookingFor: string[]
}

const TABS = [
  { id: 'all', label: 'All', icon: '👥' },
  { id: 'online', label: 'Online', icon: '🟢' },
  { id: 'dtfn', label: 'DTFN', icon: '⚡' },
  { id: 'hosting', label: 'Hosting', icon: '🏠' },
] as const

const GENDER_OPTIONS = [
  { value: 'cis_man', label: 'Cis Man' },
  { value: 'trans_man', label: 'Trans Man' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'gender_fluid', label: 'Gender Fluid' },
]

const BODY_TYPE_OPTIONS = [
  { value: 'athletic', label: 'Athletic' },
  { value: 'average', label: 'Average' },
  { value: 'bear', label: 'Bear' },
  { value: 'cub', label: 'Cub' },
  { value: 'dad_bod', label: 'Dad Bod' },
  { value: 'husky', label: 'Husky' },
  { value: 'jock', label: 'Jock' },
  { value: 'muscle', label: 'Muscle' },
  { value: 'otter', label: 'Otter' },
  { value: 'slim', label: 'Slim' },
  { value: 'stocky', label: 'Stocky' },
  { value: 'thick', label: 'Thick' },
]

export default function GridFilterBar({ onFilterChange }: FilterBarProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'dtfn' | 'hosting'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [genderIdentity, setGenderIdentity] = useState<string[]>([])
  const [bodyTypes, setBodyTypes] = useState<string[]>([])

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    onFilterChange({ tab, genderIdentity, bodyTypes, lookingFor: [] })
  }

  const toggleGender = (value: string) => {
    const updated = genderIdentity.includes(value)
      ? genderIdentity.filter(g => g !== value)
      : [...genderIdentity, value]
    setGenderIdentity(updated)
    onFilterChange({ tab: activeTab, genderIdentity: updated, bodyTypes, lookingFor: [] })
  }

  const toggleBodyType = (value: string) => {
    const updated = bodyTypes.includes(value)
      ? bodyTypes.filter(b => b !== value)
      : [...bodyTypes, value]
    setBodyTypes(updated)
    onFilterChange({ tab: activeTab, genderIdentity, bodyTypes: updated, lookingFor: [] })
  }

  const clearFilters = () => {
    setGenderIdentity([])
    setBodyTypes([])
    onFilterChange({ tab: activeTab, genderIdentity: [], bodyTypes: [], lookingFor: [] })
  }

  const activeFilterCount = genderIdentity.length + bodyTypes.length

  return (
    <div className="bg-black border-b border-white/10">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-lime-400 to-cyan-400 text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
        
        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ml-auto
            ${showFilters || activeFilterCount > 0
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/15'
            }
          `}
        >
          <span>🔍</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-4 space-y-4 bg-black/50 border-t border-white/5">
              {/* Gender Identity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Gender Identity</h3>
                  {genderIdentity.length > 0 && (
                    <button
                      onClick={() => {
                        setGenderIdentity([])
                        onFilterChange({ tab: activeTab, genderIdentity: [], bodyTypes, lookingFor: [] })
                      }}
                      className="text-xs text-lime-400 hover:text-lime-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleGender(option.value)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${genderIdentity.includes(option.value)
                          ? 'bg-lime-400 text-black'
                          : 'bg-white/10 text-white/70 hover:bg-white/15'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Body Type</h3>
                  {bodyTypes.length > 0 && (
                    <button
                      onClick={() => {
                        setBodyTypes([])
                        onFilterChange({ tab: activeTab, genderIdentity, bodyTypes: [], lookingFor: [] })
                      }}
                      className="text-xs text-lime-400 hover:text-lime-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleBodyType(option.value)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${bodyTypes.includes(option.value)
                          ? 'bg-cyan-400 text-black'
                          : 'bg-white/10 text-white/70 hover:bg-white/15'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear All */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
