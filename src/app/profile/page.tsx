'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    display_name: '',
    age: '',
    bio: '',
    position: '',
    kinks: [] as string[],
    tags: [] as string[],
    party_friendly: false,
    dtfn: false,
    photos: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const kinkOptions = [
    'BDSM', 'Roleplay', 'Fetish', 'Kink', 'Bondage', 'Domination', 'Submission',
    'S&M', 'Leather', 'Latex', 'Foot', 'Anal', 'Oral', 'Threesome', 'Group',
    'Public', 'Voyeur', 'Exhibition', 'Toys', 'Rough', 'Gentle', 'Romantic'
  ]

  const positionOptions = [
    'Top', 'Bottom', 'Vers Top', 'Vers Bottom', 'Versatile', 'Side'
  ]

  const tagOptions = [
    'Athletic', 'Bear', 'Daddy', 'Twink', 'Jock', 'Geek', 'Artist', 'Musician',
    'Student', 'Professional', 'Traveler', 'Foodie', 'Gamer', 'Fitness', 'Yoga',
    'Outdoors', 'Nightlife', 'Quiet', 'Social', 'Adventurous', 'Chill', 'Wild'
  ]

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        console.log('Profile loaded:', profile)
        console.log('Profile error:', profileError)

        if (profile) {
          console.log('Profile photos:', profile.photos)
          setProfileData({
            display_name: profile.display_name || '',
            age: profile.age?.toString() || '',
            bio: profile.about || '',
            position: profile.position || '',
            kinks: profile.kinks || [],
            tags: profile.tags || [],
            party_friendly: profile.party_friendly || false,
            dtfn: profile.dtfn || false,
            photos: profile.photos || [] // Use photos column
          })
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

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

      console.log('Saving profile with photos:', profileData.photos)
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email, // Add email field
          display_name: profileData.display_name,
          age: parseInt(profileData.age),
          about: profileData.bio,
          position: profileData.position,
          kinks: profileData.kinks,
          tags: profileData.tags,
          party_friendly: profileData.party_friendly,
          dtfn: profileData.dtfn,
          photos: profileData.photos, // Store photos as JSON array
          updated_at: new Date().toISOString()
        })

      console.log('Save error:', error)

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

  const handleKinkToggle = (kink: string) => {
    setProfileData(prev => ({
      ...prev,
      kinks: prev.kinks.includes(kink)
        ? prev.kinks.filter(k => k !== kink)
        : [...prev.kinks, kink]
    }))
  }

  const handleTagToggle = (tag: string) => {
    setProfileData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      console.log('Uploading photo:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError(`Upload failed: ${uploadError.message}`)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      console.log('Photo uploaded successfully:', publicUrl)

      setProfileData(prev => {
        const newPhotos = [...prev.photos, publicUrl]
        console.log('Updated photos array:', newPhotos)
        return {
          ...prev,
          photos: newPhotos
        }
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Photo upload error:', err)
      setError('Failed to upload photo')
    } finally {
      setLoading(false)
    }
  }

  const removePhoto = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
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

      <div className="pt-20 p-4 max-w-2xl mx-auto">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Photo Upload Section */}
          <div className="glass-bubble p-6">
            <label className="block text-white/80 text-sm font-medium mb-4">
              Photos
            </label>
            
            {profileData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {profileData.photos.map((photo, index) => {
                  console.log('Rendering photo:', photo, 'at index:', index)
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-xl"
                        onError={(e) => {
                          console.error('Image failed to load:', photo)
                          e.currentTarget.src = 'https://via.placeholder.com/300x300/333/fff?text=Photo+Error'
                        }}
                        onLoad={() => console.log('Image loaded successfully:', photo)}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 transition-all duration-300"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Debug info */}
            <div className="text-xs text-white/40 mb-2">
              Photos count: {profileData.photos.length}
            </div>
            
            <label className="block">
              <div className="glass-bubble p-4 text-center cursor-pointer hover:bg-white/10 transition-all duration-300 border-2 border-dashed border-white/20 rounded-xl">
                <svg className="w-8 h-8 text-white/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-white/80 text-sm">Add Photo</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </label>
          </div>

          {/* Display Name */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={profileData.display_name}
              onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              placeholder="Your display name"
              required
            />
          </div>

          {/* Age */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Age *
            </label>
            <input
              type="number"
              value={profileData.age}
              onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              placeholder="Your age"
              min="18"
              max="100"
              required
            />
          </div>

          {/* Position */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Position *
            </label>
            <select
              value={profileData.position}
              onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
              required
            >
              <option value="">Select position</option>
              {positionOptions.map(pos => (
                <option key={pos} value={pos} className="bg-gray-800">{pos}</option>
              ))}
            </select>
          </div>

          {/* Status Toggles */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-4">
              Status
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2">
                  <span>🥳</span>
                  Party Friendly
                </span>
                <input
                  type="checkbox"
                  checked={profileData.party_friendly}
                  onChange={(e) => setProfileData(prev => ({ ...prev, party_friendly: e.target.checked }))}
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2">
                  <span>⚡</span>
                  DTFN (Down to F*** Now)
                </span>
                <input
                  type="checkbox"
                  checked={profileData.dtfn}
                  onChange={(e) => setProfileData(prev => ({ ...prev, dtfn: e.target.checked }))}
                  className="toggle"
                />
              </label>
            </div>
          </div>

          {/* Kinks */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-3">
              Kinks
            </label>
            <div className="flex flex-wrap gap-2">
              {kinkOptions.map(kink => (
                <button
                  key={kink}
                  type="button"
                  onClick={() => handleKinkToggle(kink)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                    profileData.kinks.includes(kink)
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {kink}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                    profileData.tags.includes(tag)
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="glass-bubble p-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 resize-none"
              placeholder="Tell us about yourself... (Use emojis like the Grindr reference!)"
              rows={4}
              maxLength={500}
            />
            <div className="text-right text-xs text-white/40 mt-1">
              {profileData.bio.length}/500
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

        {/* Guidelines Link */}
        <div className="mb-4 mt-6">
          <Link
            href="/guidelines"
            className="glass-bubble p-4 flex items-center justify-between"
          >
            <span>Community Guidelines</span>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        {/* Logout Button */}
        <div className="mt-4">
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