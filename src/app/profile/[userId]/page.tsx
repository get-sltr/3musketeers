'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile'
import Link from 'next/link'

interface UserProfile {
  id: string
  display_name: string
  age: number | null
  bio: string | null
  position: string | null
  kinks: string[]
  tags: string[]
  party_friendly: boolean
  dtfn: boolean
  photos: string[]
  is_online: boolean
  distance_miles?: number
  founder_number?: number | null
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async () => {
    router.push(`/messages?user=${userId}`)
  }

  const handleTap = async () => {
    try {
      const response = await fetch('/api/taps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_user_id: userId })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to send tap')
        return
      }

      alert('Tap sent! 👋')
    } catch (error) {
      console.error('Error sending tap:', error)
      alert('Failed to send tap')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Profile not found</div>
          <Link href="/app" className="text-cyan-400">Go back</Link>
        </div>
      </div>
    )
  }

  const primaryPhoto = profile.photos[currentPhotoIndex] || profile.photos[0] || DEFAULT_PROFILE_IMAGE

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">{profile.display_name}</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4 max-w-2xl mx-auto">
        {/* Photo Gallery */}
        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden mb-4">
          <img
            src={primaryPhoto}
            alt={profile.display_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE
            }}
          />
          {/* Photo indicators */}
          {profile.photos.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1">
              {profile.photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPhotoIndex(idx)}
                  className={`h-1 rounded-full transition-all ${
                    idx === currentPhotoIndex ? 'w-8 bg-white' : 'w-4 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
          {/* Navigation arrows */}
          {profile.photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 glass-bubble p-3 hover:bg-white/20"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 glass-bubble p-3 hover:bg-white/20"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Profile Info Card */}
        <div className="glass-bubble p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-3xl font-bold text-white">{profile.display_name}</h2>
            {profile.age && (
              <span className="text-2xl text-white/80">{profile.age}</span>
            )}
            {profile.is_online && (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">Online</span>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex gap-2 mb-4">
            {profile.position && (
              <span className="px-3 py-1 rounded-full bg-cyan-400/30 text-cyan-100 text-sm font-semibold">
                {profile.position}
              </span>
            )}
            {profile.party_friendly && (
              <span className="px-3 py-1 rounded-full bg-white/15 text-white/80 text-sm">
                🥳 Party Friendly
              </span>
            )}
            {profile.dtfn && (
              <span className="px-3 py-1 rounded-full bg-red-500/30 text-red-200 text-sm">
                ⚡ DTFN
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-white/70 mb-4 leading-relaxed">{profile.bio}</p>
          )}

          {/* Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="mb-4">
              <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Vibes</p>
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kinks */}
          {profile.kinks && profile.kinks.length > 0 && (
            <div>
              <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Into</p>
              <div className="flex flex-wrap gap-2">
                {profile.kinks.map((kink) => (
                  <span key={kink} className="px-3 py-1 rounded-full bg-magenta-500/20 text-magenta-200 text-sm">
                    {kink}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={handleChat}
            className="py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold text-lg hover:scale-[1.02] transition-all duration-300 shadow-lg"
          >
            💬 Chat
          </button>
          <button
            onClick={handleTap}
            className="py-4 rounded-2xl glass-bubble text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300"
          >
            👋 Tap
          </button>
        </div>
      </div>
    </div>
  )
}
