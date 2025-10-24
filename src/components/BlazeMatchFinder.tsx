'use client'

import { useState } from 'react'

interface BlazeMatchFinderProps {
  userProfile: any
  onFindMatches: (matches: any[]) => void
}

export default function BlazeMatchFinder({ userProfile, onFindMatches }: BlazeMatchFinderProps) {
  const [isFinding, setIsFinding] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [criteria, setCriteria] = useState({
    interests: true,
    location: true,
    age: true,
    lifestyle: true
  })

  const findMatches = async () => {
    setIsFinding(true)
    
    // Simulate AI match finding (replace with actual Perplexity API call)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Generate AI-powered match suggestions
    const aiMatches = [
      {
        id: 'ai_match_1',
        name: 'Alex',
        age: 25,
        compatibility: 92,
        reason: 'Shared interests in photography and travel',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        tags: ['Photography', 'Travel', 'Adventure']
      },
      {
        id: 'ai_match_2', 
        name: 'Jordan',
        age: 28,
        compatibility: 88,
        reason: 'Similar lifestyle and values',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        tags: ['Fitness', 'Music', 'Art']
      },
      {
        id: 'ai_match_3',
        name: 'Casey',
        age: 26,
        compatibility: 85,
        reason: 'Complementary personalities and goals',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        tags: ['Technology', 'Gaming', 'Food']
      }
    ]
    
    setMatches(aiMatches)
    onFindMatches(aiMatches)
    setIsFinding(false)
  }

  return (
    <div className="glass-bubble p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🔥</div>
        <div>
          <h3 className="text-white text-xl font-bold">Blaze AI Match Finder</h3>
          <p className="text-white/60 text-sm">Powered by Perplexity</p>
        </div>
      </div>
      
      <p className="text-white/80 mb-4">
        Let Blaze AI analyze your profile and find the most compatible matches based on your preferences!
      </p>
      
      {/* Match Criteria */}
      <div className="mb-4">
        <h4 className="text-white font-semibold mb-2">Match Criteria:</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(criteria).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 text-white/80 text-sm">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setCriteria(prev => ({ ...prev, [key]: e.target.checked }))}
                className="w-4 h-4 text-orange-500 bg-white/10 border-white/20 rounded focus:ring-orange-500"
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          ))}
        </div>
      </div>
      
      <button
        onClick={findMatches}
        disabled={isFinding}
        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isFinding ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Blaze AI is finding matches...</span>
          </>
        ) : (
          <>
            <span>🔥</span>
            <span>Find My Matches</span>
          </>
        )}
      </button>
      
      {matches.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-white font-semibold">Blaze AI Found {matches.length} Compatible Matches:</h4>
          {matches.map((match) => (
            <div key={match.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <img 
                src={match.photo} 
                alt={match.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="text-white font-semibold">{match.name}, {match.age}</h5>
                  <div className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                    {match.compatibility}% match
                  </div>
                </div>
                <p className="text-white/70 text-sm mb-2">{match.reason}</p>
                <div className="flex gap-1">
                  {match.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
