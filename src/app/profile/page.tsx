'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      // Load user profile data
      setUsername(user.user_metadata?.username || '')
      setAge(user.user_metadata?.age || '')
      setBio(user.user_metadata?.bio || '')
      setPhoto(user.user_metadata?.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400')
    }
    loadProfile()
  }, [router, supabase.auth])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          username,
          age: parseInt(age),
          bio,
          photo
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, just use a placeholder URL
      // In production, you'd upload to Supabase Storage
      setPhoto('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400')
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between">
          <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Edit Profile</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 p-4 max-w-2xl mx-auto">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="glass-bubble p-6 text-center">
            <div className="relative inline-block">
              <img
                src={photo}
                alt="Profile"
                className="w-32 h-32 rounded-2xl object-cover mx-auto mb-4"
              />
              <label className="absolute bottom-0 right-0 glass-bubble p-2 rounded-full cursor-pointer hover:bg-white/20 transition-all duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-white/60 text-sm">Tap to change photo</p>
          </div>

          {/* Username */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Age */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              placeholder="Enter your age"
              min="18"
              max="100"
              required
            />
          </div>

          {/* Bio */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 resize-none"
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-xs text-white/40 mt-1">
              {bio.length}/500
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="glass-bubble p-4 bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="glass-bubble p-4 bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-sm">Profile saved successfully!</p>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full gradient-button py-4 rounded-2xl text-white font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
              boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Logout Button */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full glass-bubble py-4 rounded-2xl text-red-400 font-semibold text-lg hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  )
}
