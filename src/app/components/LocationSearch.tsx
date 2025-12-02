'use client'

import { useState } from 'react'
import { getMapboxToken } from '@/lib/maps/getMapboxToken'

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number, placeName: string) => void
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const searchLocation = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const token = await getMapboxToken()
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&types=place,locality,neighborhood,address`
      )
      const data = await response.json()
      setResults(data.features || [])
      setShowResults(true)
    } catch (error) {
      console.error('Error searching location:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchLocation(query)
  }

  const handleSelect = (result: any) => {
    const [lng, lat] = result.center
    onLocationSelect(lat, lng, result.place_name)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length >= 3) {
              searchLocation(e.target.value)
            } else {
              setResults([])
              setShowResults(false)
            }
          }}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true)
            }
          }}
          placeholder="Search city, county, or place..."
          aria-label="Search locations"
          className="w-full px-4 py-3 pr-10 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white text-sm font-medium placeholder-white/50 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all shadow-lg"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {isSearching && (
        <div className="absolute top-full mt-2 w-full p-3 rounded-xl bg-black/80 border border-white/10 text-white text-sm text-center">
          Searching...
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full max-h-64 overflow-y-auto rounded-xl bg-black/90 border border-cyan-500/20 backdrop-blur-xl shadow-2xl z-50">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/20 transition border-b border-white/10 last:border-b-0"
            >
              <div className="font-medium text-sm">{result.text}</div>
              <div className="text-xs text-white/60 mt-1">{result.place_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
