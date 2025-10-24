'use client'

import { useState } from 'react'

interface BlazeProfileOptimizerProps {
  currentProfile: any
  onOptimize: (suggestions: string[]) => void
}

export default function BlazeProfileOptimizer({ currentProfile, onOptimize }: BlazeProfileOptimizerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const analyzeProfile = async () => {
    setIsAnalyzing(true)
    
    // Simulate AI analysis (replace with actual Perplexity API call)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const profileSuggestions = []
    
    // Analyze different aspects of the profile
    if (!currentProfile.bio || currentProfile.bio.length < 50) {
      profileSuggestions.push("Your bio could be more engaging. Try adding a fun fact or what you're passionate about!")
    }
    
    if (!currentProfile.photos || currentProfile.photos.length < 3) {
      profileSuggestions.push("Add more photos to showcase your personality and interests!")
    }
    
    if (!currentProfile.interests || currentProfile.interests.length < 3) {
      profileSuggestions.push("Add more specific interests to help people find common ground with you!")
    }
    
    if (!currentProfile.about || currentProfile.about.length < 30) {
      profileSuggestions.push("Your 'About' section could be more detailed. Share what makes you unique!")
    }
    
    if (!currentProfile.position) {
      profileSuggestions.push("Adding your position/role helps people understand your preferences!")
    }
    
    if (!currentProfile.tags || currentProfile.tags.length < 2) {
      profileSuggestions.push("Add more tags to help people discover you based on shared interests!")
    }
    
    // Add positive reinforcement
    if (currentProfile.photos && currentProfile.photos.length >= 3) {
      profileSuggestions.push("Great job on your photos! They really show your personality!")
    }
    
    if (currentProfile.bio && currentProfile.bio.length >= 50) {
      profileSuggestions.push("Your bio is engaging and tells a good story about who you are!")
    }
    
    setSuggestions(profileSuggestions)
    onOptimize(profileSuggestions)
    setIsAnalyzing(false)
  }

  return (
    <div className="glass-bubble p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🔥</div>
        <div>
          <h3 className="text-white text-xl font-bold">Blaze AI Profile Optimizer</h3>
          <p className="text-white/60 text-sm">Powered by Perplexity</p>
        </div>
      </div>
      
      <p className="text-white/80 mb-4">
        Let Blaze AI analyze your profile and suggest improvements to help you make better connections!
      </p>
      
      <button
        onClick={analyzeProfile}
        disabled={isAnalyzing}
        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Blaze AI is analyzing...</span>
          </>
        ) : (
          <>
            <span>🔥</span>
            <span>Optimize My Profile</span>
          </>
        )}
      </button>
      
      {suggestions.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-white font-semibold">Blaze AI Suggestions:</h4>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
              <div className="text-orange-400 text-lg">💡</div>
              <p className="text-white/90 text-sm">{suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
