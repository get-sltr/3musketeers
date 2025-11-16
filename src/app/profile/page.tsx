'use client'

import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AlbumsManager from '../../components/AlbumsManager'
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils/profile'

interface Album {
  id: string
  name: string
  description?: string
  is_public: boolean
  photos: string[]
  permissions: {
    granted_to_user_id: string
    granted_to_name: string
    granted_at: string
    expires_at?: string
  }[]
}

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
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAlbumsManager, setShowAlbumsManager] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

  const POSITIONS = ['Top', 'Top/Vers', 'Vers', 'Btm/Vers', 'Bottom', 'Side']
  const KINKS_OPTIONS = ['BDSM', 'Fetish', 'Roleplay', 'Voyeurism', 'Exhibitionism', 'Group Sex', 'Anal', 'Oral', 'Toys', 'Leather', 'Bondage', 'Spanking', 'Domination', 'Submission', 'Edging', 'Public Play', 'Feet', 'Watersports', 'Rimming', 'Body Worship', 'Spit', 'Rough']
  const TAGS_OPTIONS = ['Adventurous', 'Chill', 'Direct', 'Curious', 'Beard', 'Jock', 'Bear', 'Rugged', 'Daddy', 'Pup', 'Twink', 'Otter', 'Wolf', 'Muscle', 'Fit', 'Discreet', 'Kinky', 'Vanilla', 'Wild', 'Gentleman', 'Playful', 'Passionate']

  type SectionKey = 'identity' | 'interaction' | 'interests' | 'bio'

  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    identity: true,
    interaction: true,
    interests: true,
    bio: true
  })

  const toggleSection = (id: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const Switch = ({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        onChange(!checked)
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${checked ? 'bg-cyan-400/80' : 'bg-white/20'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )

  const SectionCard = ({
    id,
    title,
    description,
    rightSlot,
    children,
  }: {
    id: SectionKey
    title: string
    description?: string
    rightSlot?: ReactNode
    children: ReactNode
  }) => {
    const isOpen = expandedSections[id]
    return (
      <div className="glass-bubble p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between px-5 py-4 text-left text-white/80 hover:bg-white/5 transition-colors duration-300"
        >
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-white/60 mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-3">
            {rightSlot}
            <svg
              className={`w-5 h-5 text-white/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {isOpen && (
          <div className="px-5 pb-5 pt-1 border-t border-white/10 space-y-5">
            {children}
          </div>
        )}
      </div>
    )
  }

  const primaryPhoto = profileData.photos[0] || DEFAULT_PROFILE_IMAGE

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          setError('Authentication failed. Please login again.')
          router.push('/login')
          return
        }
        
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

        if (profileError) {
          console.error('Profile error:', profileError)
          setError('Failed to load profile. Please try again.')
          return
        }

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
            photos: profile.photos || []
          })
        }

        // Load albums
        await loadAlbums()
      } catch (err) {
        console.error('Error loading profile:', err)
        setError('An unexpected error occurred. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [router, supabase])

  const loadAlbums = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: albumsData, error } = await supabase
        .from('albums')
        .select(`
          *,
          album_permissions (
            granted_to_user_id,
            granted_at,
            expires_at,
            is_active,
            profiles (
              display_name
            )
          ),
          album_photos (
            photo_url,
            photo_order
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading albums:', error)
        return
      }

      const transformedAlbums: Album[] = albumsData?.map(album => ({
        id: album.id,
        name: album.name,
        description: album.description,
        is_public: album.is_public,
        photos: album.album_photos
          ?.sort((a: any, b: any) => a.photo_order - b.photo_order)
          .map((photo: any) => photo.photo_url) || [],
        permissions: album.album_permissions
          ?.filter((p: any) => p.is_active)
          .map((p: any) => ({
            granted_to_user_id: p.granted_to_user_id,
            granted_to_name: p.profiles?.display_name || 'Unknown',
            granted_at: p.granted_at,
            expires_at: p.expires_at
          })) || []
      })) || []

      setAlbums(transformedAlbums)
    } catch (err) {
      console.error('Error loading albums:', err)
    }
  }

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
      
      // Validate age - only include if it's a valid number
      const ageValue = profileData.age ? parseInt(profileData.age, 10) : null
      if (ageValue !== null && (isNaN(ageValue) || ageValue < 18 || ageValue > 100)) {
        setError('Please enter a valid age between 18 and 100')
        setSaving(false)
        return
      }

      // Build update object with only valid fields
      const updateData: any = {
        id: user.id,
        display_name: profileData.display_name || null,
        about: profileData.bio || null,
        position: profileData.position || null,
        kinks: profileData.kinks.length > 0 ? profileData.kinks : null,
        tags: profileData.tags.length > 0 ? profileData.tags : null,
        party_friendly: profileData.party_friendly,
        dtfn: profileData.dtfn,
        photos: profileData.photos.length > 0 ? profileData.photos : null,
        updated_at: new Date().toISOString()
      }

      // Only include age if it's valid
      if (ageValue !== null && !isNaN(ageValue)) {
        updateData.age = ageValue
      }

      // Only include email if user has one
      if (user.email) {
        updateData.email = user.email
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updateData)

      console.log('Save error:', error)

      if (error) {
        console.error('Profile save error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        setError(error.message || 'Failed to save profile. Please check your input.')
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)

      // Create image to check/resize
      const img = new Image()
      const reader = new FileReader()

      const processedFile = await new Promise<File>((resolve, reject) => {
        reader.onload = (event) => {
          img.onload = () => {
            // Create canvas with 3:4 aspect ratio
            const targetWidth = 800
            const targetHeight = 1067 // 800 * 4/3
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              reject(new Error('Failed to get canvas context'))
              return
            }

            canvas.width = targetWidth
            canvas.height = targetHeight

            // Calculate scaling to cover the target dimensions
            const scale = Math.max(targetWidth / img.width, targetHeight / img.height)
            const scaledWidth = img.width * scale
            const scaledHeight = img.height * scale

            // Center the image
            const x = (targetWidth - scaledWidth) / 2
            const y = (targetHeight - scaledHeight) / 2

            // Draw image
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

            // Convert to blob
            canvas.toBlob((blob) => {
              if (blob) {
                const processedFile = new File([blob], file.name, { type: 'image/jpeg' })
                resolve(processedFile)
              } else {
                reject(new Error('Failed to create blob'))
              }
            }, 'image/jpeg', 0.9)
          }
          img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
      })

      const fileExt = 'jpg'
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      console.log('Uploading photo:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, processedFile)

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

  const openPhotoViewer = (album: Album, photoIndex: number) => {
    setSelectedAlbum(album)
    setCurrentPhotoIndex(photoIndex)
    setShowPhotoViewer(true)
  }

  const nextPhoto = () => {
    if (selectedAlbum && selectedAlbum.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev + 1) % selectedAlbum.photos.length)
    }
  }

  const prevPhoto = () => {
    if (selectedAlbum && selectedAlbum.photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev - 1 + selectedAlbum.photos.length) % selectedAlbum.photos.length)
    }
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
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between">
          <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Edit Profile</h1>
          <button
            onClick={() => setShowAlbumsManager(true)}
            className="glass-bubble px-4 py-2 text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
          >
            📸 Albums
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-32 px-4">
        <div className="max-w-6xl mx-auto grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="glass-bubble p-6 relative overflow-hidden">
              {primaryPhoto && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-10 blur-3xl"
                  style={{ backgroundImage: `url(${primaryPhoto})` }}
                />
              )}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="relative w-24 h-24 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                  <img
                    src={primaryPhoto}
                    alt={profileData.display_name || 'Profile photo'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 glass-bubble px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                  >
                    Update
                  </button>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{profileData.display_name || 'Unnamed'}</h2>
                    {profileData.age && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white/15 text-white/80">
                        {profileData.age} yrs
                      </span>
                    )}
                    {profileData.position && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-cyan-400/30 text-cyan-100">
                        {profileData.position}
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed max-w-xl">
                    {profileData.bio ? profileData.bio.split('\n')[0] : 'Add a headline to let members know your vibe.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.party_friendly && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] bg-white/15 text-white/80">
                        🥳 Party Friendly
                      </span>
                    )}
                    {profileData.dtfn && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] bg-white/15 text-white/80">
                        ⚡ Ready Now
                      </span>
                    )}
                    {profileData.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] bg-white/10 text-white/60">
                        {tag}
                      </span>
                    ))}
                    {profileData.tags.length > 3 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] bg-white/10 text-white/60">
                        +{profileData.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <SectionCard
              id="identity"
              title="Identity & Stats"
              description="Shape what others learn about you."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profileData.display_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                    className="w-full rounded-2xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Choose your stage name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Age</label>
                  <input
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full rounded-2xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Age"
                    min={18}
                    max={100}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white/60 mb-2">Position</label>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, position: pos }))}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                          profileData.position === pos ? 'bg-cyan-400/30 text-cyan-100 shadow' : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="interaction"
              title="Energy & Interaction"
              description="Signal how you like to connect."
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 border border-white/10">
                  <div>
                    <p className="text-white font-medium">Party Friendly</p>
                    <p className="text-white/60 text-sm">Let others know you’re open to host or hit the scene.</p>
                  </div>
                  <Switch
                    checked={profileData.party_friendly}
                    onChange={(checked) => setProfileData(prev => ({ ...prev, party_friendly: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 border border-white/10">
                  <div>
                    <p className="text-white font-medium">DTFN ⚡</p>
                    <p className="text-white/60 text-sm">Show up in the “ready now” radar.</p>
                  </div>
                  <Switch
                    checked={profileData.dtfn}
                    onChange={(checked) => setProfileData(prev => ({ ...prev, dtfn: checked }))}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="interests"
              title="Kinks & Interests"
              description="Curate your vibe with quick taps."
            >
              <div className="space-y-4">
                <div>
                  <p className="text-white/70 text-sm mb-2 uppercase tracking-[0.2em]">Kinks</p>
                  <div className="flex flex-wrap gap-2">
                    {KINKS_OPTIONS.map(kink => {
                      const active = profileData.kinks.includes(kink)
                      return (
                        <button
                          key={kink}
                          type="button"
                          onClick={() =>
                            setProfileData(prev => ({
                              ...prev,
                              kinks: active
                                ? prev.kinks.filter(k => k !== kink)
                                : [...prev.kinks, kink]
                            }))
                          }
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                            active ? 'bg-magenta-500/40 text-white shadow' : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {kink}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-2 uppercase tracking-[0.2em]">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {TAGS_OPTIONS.map(tag => {
                      const active = profileData.tags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setProfileData(prev => ({
                              ...prev,
                              tags: active
                                ? prev.tags.filter(t => t !== tag)
                                : [...prev.tags, tag]
                            }))
                          }
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                            active ? 'bg-purple-500/40 text-white shadow' : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="bio"
              title="Headlines & Notes"
              description="Leave something memorable."
            >
              <div className="space-y-3">
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={5}
                  maxLength={500}
                  placeholder="Let SLTR know your vibe, your boundaries, or your invite."
                  className="w-full rounded-2xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                />
                <div className="text-right text-xs text-white/40">{profileData.bio.length}/500 characters</div>
              </div>
            </SectionCard>

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

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 gradient-button py-4 rounded-2xl text-white font-semibold text-lg hover:scale-[1.02] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #ff00ff)', boxShadow: '0 0 30px rgba(0, 212, 255, 0.25)' }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="glass-bubble py-4 px-6 rounded-2xl text-red-400 font-semibold text-lg hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="glass-bubble p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Media Gallery</h3>
                <label className="glass-bubble px-4 py-2 cursor-pointer hover:bg-white/10 transition-all duration-300 text-sm text-white">
                  + Add Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                </label>
              </div>
              {profileData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profileData.photos.map((photo, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full aspect-square object-cover"
                        onError={() => removePhoto(index)}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-white/60">No photos yet</p>
                  <p className="text-white/40 text-sm">Add your first photo to get started</p>
                </div>
              )}
            </div>

            <div className="glass-bubble p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Photo Albums</h3>
                <button
                  type="button"
                  onClick={() => setShowAlbumsManager(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                >
                  Manage Albums
                </button>
              </div>
              {albums.length > 0 ? (
                <div className="space-y-4">
                  {albums.map(album => (
                    <div key={album.id} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{album.name}</h4>
                          {album.description && <p className="text-white/60 text-sm mt-1">{album.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${album.is_public ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-300'}`}>
                            {album.is_public ? 'Public' : 'Private'}
                          </span>
                          {album.permissions.length > 0 && (
                            <span className="text-xs text-cyan-300">{album.permissions.length} shared</span>
                          )}
                        </div>
                      </div>
                      {album.photos.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {album.photos.slice(0, 4).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`${album.name} photo ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:scale-105 transition-all duration-300"
                              onClick={() => openPhotoViewer(album, index)}
                            />
                          ))}
                          {album.photos.length > 4 && (
                            <button
                              type="button"
                              className="aspect-square bg-white/10 rounded-lg text-white/70 text-sm font-semibold hover:bg-white/15 transition-colors duration-300"
                              onClick={() => openPhotoViewer(album, 4)}
                            >
                              +{album.photos.length - 4}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-white/60 text-sm">No photos yet</div>
                      )}
                      <div className="flex items-center justify-between text-sm text-white/50">
                        <span>{album.photos.length} photos</span>
                        <button
                          type="button"
                          onClick={() => openPhotoViewer(album, 0)}
                          className="text-cyan-300 hover:text-cyan-200 transition-colors duration-300"
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-white/60 mb-3">No albums yet</p>
                  <p className="text-white/40 text-sm mb-4">Create albums to curate who sees what.</p>
                  <button
                    type="button"
                    onClick={() => setShowAlbumsManager(true)}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                  >
                    Create First Album
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Albums Manager Modal */}
      <AlbumsManager
        isOpen={showAlbumsManager}
        onClose={() => setShowAlbumsManager(false)}
        onAlbumShare={(albumId, albumName) => {
          console.log('Share album:', albumId, albumName)
          // TODO: Implement album sharing
        }}
      />

      {/* Photo Viewer Modal */}
      {showPhotoViewer && selectedAlbum && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setShowPhotoViewer(false)}
              className="absolute top-4 right-4 z-10 glass-bubble p-3 hover:bg-white/10 transition-all duration-300"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Photo */}
            <img
              src={selectedAlbum.photos[currentPhotoIndex]}
              alt={`${selectedAlbum.name} photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-contain rounded-2xl"
            />

            {/* Navigation */}
            {selectedAlbum.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 glass-bubble p-3 hover:bg-white/10 transition-all duration-300"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 glass-bubble p-3 hover:bg-white/10 transition-all duration-300"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo Info */}
            <div className="absolute bottom-4 left-4 right-4 glass-bubble p-4 rounded-xl">
              <h3 className="text-white font-bold text-lg">{selectedAlbum.name}</h3>
              <p className="text-white/60 text-sm">
                Photo {currentPhotoIndex + 1} of {selectedAlbum.photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}