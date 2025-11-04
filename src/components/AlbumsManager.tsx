'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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

interface AlbumsManagerProps {
  isOpen: boolean
  onClose: () => void
  onAlbumShare: (albumId: string, albumName: string) => void
}

export default function AlbumsManager({ isOpen, onClose, onAlbumShare }: AlbumsManagerProps) {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadAlbums()
    }
  }, [isOpen])

  const loadAlbums = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load albums with permissions
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
    } finally {
      setLoading(false)
    }
  }

  const createAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlbumName.trim()) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          name: newAlbumName.trim(),
          description: newAlbumDescription.trim() || null,
          is_public: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating album:', error)
        return
      }

      setNewAlbumName('')
      setNewAlbumDescription('')
      setShowCreateForm(false)
      loadAlbums()
    } catch (err) {
      console.error('Error creating album:', err)
    } finally {
      setUploading(false)
    }
  }

  const uploadPhotoToAlbum = async (albumId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `albums/${albumId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      // Add photo to album
      const { error: insertError } = await supabase
        .from('album_photos')
        .insert({
          album_id: albumId,
          photo_url: publicUrl,
          photo_order: 0
        })

      if (insertError) {
        console.error('Error adding photo to album:', insertError)
      }
    } catch (err) {
      console.error('Error uploading photo:', err)
    }
  }

  const toggleAlbumPublic = async (albumId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ is_public: isPublic })
        .eq('id', albumId)

      if (error) {
        console.error('Error updating album:', error)
      } else {
        loadAlbums()
      }
    } catch (err) {
      console.error('Error updating album:', err)
    }
  }

  const revokeAccess = async (albumId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('album_permissions')
        .update({ is_active: false })
        .eq('album_id', albumId)
        .eq('granted_to_user_id', userId)

      if (error) {
        console.error('Error revoking access:', error)
      } else {
        loadAlbums()
      }
    } catch (err) {
      console.error('Error revoking access:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-bubble relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">📸 My Albums</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
              >
                + New Album
              </button>
              <button
                onClick={onClose}
                className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/60">Loading albums...</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-white mb-2">No Albums Yet</h3>
              <p className="text-white/60 mb-6">Create your first album to organize your photos</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
              >
                Create Album
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <div key={album.id} className="glass-bubble p-4 rounded-xl">
                  {/* Album Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{album.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAlbumShare(album.id, album.name)}
                        className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all duration-300"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => setSelectedAlbum(album)}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-all duration-300"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Album Description */}
                  {album.description && (
                    <p className="text-white/60 text-sm mb-3">{album.description}</p>
                  )}

                  {/* Album Photos Preview */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {album.photos.slice(0, 6).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`${album.name} photo ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ))}
                    {album.photos.length > 6 && (
                      <div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center">
                        <span className="text-white/60 text-sm">+{album.photos.length - 6}</span>
                      </div>
                    )}
                  </div>

                  {/* Album Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">{album.photos.length} photos</span>
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Album Form */}
        {showCreateForm && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div className="glass-bubble max-w-md w-full rounded-2xl p-6 pointer-events-auto">
              <h3 className="text-xl font-bold text-white mb-4">Create New Album</h3>
              <form onSubmit={createAlbum} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Album Name *
                  </label>
                  <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    placeholder="e.g., Beach Photos, Party Pics"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Describe this album..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 glass-bubble py-3 rounded-xl text-white font-semibold hover:bg-white/10 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !newAlbumName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Creating...' : 'Create Album'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
