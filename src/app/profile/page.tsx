'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AlbumsManager from '../../components/AlbumsManager'

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
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          display_name: profileData.display_name,
          age: parseInt(profileData.age),
          about: profileData.bio,
          position: profileData.position,
          kinks: profileData.kinks,
          tags: profileData.tags,
          party_friendly: profileData.party_friendly,
          dtfn: profileData.dtfn,
          photos: profileData.photos,
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
      <div className="pt-20 p-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
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
                  placeholder="Enter your display name"
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

              {/* Position */}
              <div className="glass-bubble p-4">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Position
                </label>
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(pos => (
                    <button
                      type="button"
                      key={pos}
                      onClick={() => setProfileData(prev => ({ ...prev, position: pos }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        profileData.position === pos
                          ? 'bg-magenta-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kinks */}
              <div className="glass-bubble p-4">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Kinks
                </label>
                <div className="flex flex-wrap gap-2">
                  {KINKS_OPTIONS.map(kink => (
                    <button
                      type="button"
                      key={kink}
                      onClick={() => setProfileData(prev => ({
                        ...prev,
                        kinks: prev.kinks.includes(kink)
                          ? prev.kinks.filter(k => k !== kink)
                          : [...prev.kinks, kink]
                      }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        profileData.kinks.includes(kink)
                          ? 'bg-cyan-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {kink}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="glass-bubble p-4">
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Tags (Interests)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAGS_OPTIONS.map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setProfileData(prev => ({
                        ...prev,
                        tags: prev.tags.includes(tag)
                          ? prev.tags.filter(t => t !== tag)
                          : [...prev.tags, tag]
                      }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        profileData.tags.includes(tag)
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Party Friendly / DTFN Toggles */}
              <div className="glass-bubble p-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer text-white/80">
                  <span>Party Friendly 🥳</span>
                  <input
                    type="checkbox"
                    checked={profileData.party_friendly}
                    onChange={(e) => setProfileData(prev => ({ ...prev, party_friendly: e.target.checked }))}
                    className="toggle toggle-primary"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer text-white/80">
                  <span>DTFN ⚡ (Down To F*** Now)</span>
                  <input
                    type="checkbox"
                    checked={profileData.dtfn}
                    onChange={(e) => setProfileData(prev => ({ ...prev, dtfn: e.target.checked }))}
                    className="toggle toggle-secondary"
                  />
                </label>
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
            <button
              onClick={handleLogout}
              className="w-full glass-bubble py-4 rounded-2xl text-red-400 font-semibold text-lg hover:bg-red-500/10 hover:text-red-300 transition-all duration-300"
            >
              🚪 Logout
            </button>
          </div>

          {/* Right Column - Photos & Albums */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Photos */}
            <div className="glass-bubble p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Profile Photos</h3>
                <label className="glass-bubble px-4 py-2 cursor-pointer hover:bg-white/10 transition-all duration-300">
                  <span className="text-white text-sm">+ Add Photo</span>
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profileData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-xl"
                        onError={(e) => {
                          console.error('Image failed to load:', photo)
                          removePhoto(index)
                        }}
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100"
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

            {/* Albums Section */}
            <div className="glass-bubble p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Photo Albums</h3>
                <button
                  onClick={() => setShowAlbumsManager(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                >
                  Manage Albums
                </button>
              </div>

              {albums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {albums.map((album) => (
                    <div key={album.id} className="glass-bubble p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-white">{album.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            album.is_public 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {album.is_public ? 'Public' : 'Private'}
                          </span>
                          {album.permissions.length > 0 && (
                            <span className="text-cyan-400 text-xs">
                              {album.permissions.length} shared
                            </span>
                          )}
                        </div>
                      </div>

                      {album.description && (
                        <p className="text-white/60 text-sm mb-3">{album.description}</p>
                      )}

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
                            <div 
                              className="aspect-square bg-white/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all duration-300"
                              onClick={() => openPhotoViewer(album, 4)}
                            >
                              <span className="text-white/60 text-sm">+{album.photos.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-2xl mb-2">📸</div>
                          <p className="text-white/60 text-sm">No photos in this album</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 text-sm">
                        <span className="text-white/60">{album.photos.length} photos</span>
                        <button
                          onClick={() => openPhotoViewer(album, 0)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
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
                  <p className="text-white/60 mb-4">No albums yet</p>
                  <p className="text-white/40 text-sm mb-4">Create albums to organize your photos and control who sees them</p>
                  <button
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