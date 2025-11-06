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
  const [albumFormName, setAlbumFormName] = useState('')
  const [albumFormDescription, setAlbumFormDescription] = useState('')
  const [albumFormPublic, setAlbumFormPublic] = useState(false)
  const [queuedPhotos, setQueuedPhotos] = useState<File[]>([])
  const [albumSaving, setAlbumSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  
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

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album)
    setAlbumFormName(album.name)
    setAlbumFormDescription(album.description || '')
    setAlbumFormPublic(album.is_public)
    setQueuedPhotos([])
  }

  const handleAlbumSave = async () => {
    if (!selectedAlbum) return

    setAlbumSaving(true)
    try {
      const { error } = await supabase
        .from('albums')
        .update({
          name: albumFormName.trim() || selectedAlbum.name,
          description: albumFormDescription.trim() || null,
          is_public: albumFormPublic,
        })
        .eq('id', selectedAlbum.id)

      if (error) {
        console.error('Error saving album:', error)
      } else {
        await loadAlbums()
        setSelectedAlbum(prev =>
          prev
            ? {
                ...prev,
                name: albumFormName.trim() || prev.name,
                description: albumFormDescription.trim(),
                is_public: albumFormPublic,
              }
            : prev,
        )
      }
    } catch (err) {
      console.error('Error saving album:', err)
    } finally {
      setAlbumSaving(false)
    }
  }

  const handleQueuedUpload = async () => {
    if (!selectedAlbum || queuedPhotos.length === 0) return

    setPhotoUploading(true)
    try {
      for (const file of queuedPhotos) {
        await uploadPhotoToAlbum(selectedAlbum.id, file)
      }
      await loadAlbums()
      setQueuedPhotos([])
    } catch (err) {
      console.error('Error uploading queued photos:', err)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handlePhotoRemove = async (albumId: string, photoUrl: string) => {
    try {
      const { error } = await supabase
        .from('album_photos')
        .delete()
        .eq('album_id', albumId)
        .eq('photo_url', photoUrl)

      if (error) {
        console.error('Error removing photo:', error)
      } else {
        await loadAlbums()
      }
    } catch (err) {
      console.error('Error removing photo:', err)
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
                        onClick={() => handleAlbumSelect(album)}
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

        {/* Manage Album Overlay */}
        {selectedAlbum && (
          <div className="absolute inset-0 z-[120] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Manage Album</h3>
                  <p className="text-white/60 text-sm">
                    Update details, upload photos, and control visibility.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAlbum(null)}
                    className="glass-bubble px-4 py-2 text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-0">
                {/* Sidebar form */}
                <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.05]">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-white/70 text-sm font-semibold mb-2">
                        Album Name
                      </label>
                      <input
                        type="text"
                        value={albumFormName}
                        onChange={(e) => setAlbumFormName(e.target.value)}
                        className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                        placeholder="Album title"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm font-semibold mb-2">
                        Description
                      </label>
                      <textarea
                        value={albumFormDescription}
                        onChange={(e) => setAlbumFormDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition resize-none"
                        placeholder="Describe this album..."
                      />
                    </div>

                    <div className="flex items-center justify-between bg-black/30 border border-white/15 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {albumFormPublic ? 'Public Album' : 'Private Album'}
                        </p>
                        <p className="text-white/60 text-xs">
                          {albumFormPublic
                            ? 'Anyone with access can view this album.'
                            : 'Only you and invited members can view.'}
                        </p>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={albumFormPublic}
                          onChange={(e) => setAlbumFormPublic(e.target.checked)}
                        />
                        <div className={`w-12 h-6 rounded-full transition ${albumFormPublic ? 'bg-cyan-500' : 'bg-white/20'}`}>
                          <div
                            className={`h-6 w-6 bg-white rounded-full shadow transform transition ${
                              albumFormPublic ? 'translate-x-6' : ''
                            }`}
                          />
                        </div>
                      </label>
                    </div>

                    <button
                      onClick={handleAlbumSave}
                      disabled={albumSaving}
                      className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {albumSaving ? 'Saving...' : 'Save Changes'}
                    </button>

                    <div className="border-t border-white/10 pt-5">
                      <label className="block text-white/70 text-sm font-semibold mb-3">
                        Upload photos
                      </label>
                      <div className="rounded-2xl border border-dashed border-cyan-500/40 bg-black/20 px-4 py-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              setQueuedPhotos(Array.from(e.target.files))
                            }
                          }}
                          className="block w-full text-sm text-white/70 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-200 hover:file:bg-cyan-500/30"
                        />
                        <p className="text-white/50 text-xs mt-3">You can select multiple files at once.</p>
                        {queuedPhotos.length > 0 && (
                          <div className="mt-4 space-y-2 text-left max-h-24 overflow-y-auto">
                            {queuedPhotos.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs text-white/70 bg-black/30 rounded-lg px-3 py-2">
                                <span className="truncate">{file.name}</span>
                                <span>{Math.round(file.size / 1024)} KB</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={handleQueuedUpload}
                          disabled={photoUploading || queuedPhotos.length === 0}
                          className="mt-4 w-full px-4 py-2 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {photoUploading ? 'Uploading...' : 'Upload Selected Photos'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Album photos grid */}
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Photos</h4>
                    {selectedAlbum.photos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 bg-black/20 border border-white/10 rounded-2xl">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-white/60 text-sm">No photos in this album yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedAlbum.photos.map((photo, index) => (
                          <div key={index} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/30">
                            <img src={photo} alt={`Album photo ${index + 1}`} className="w-full aspect-square object-cover" />
                            <button
                              onClick={() => handlePhotoRemove(selectedAlbum.id, photo)}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              title="Remove photo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Sharing</h4>
                    {selectedAlbum.permissions.length === 0 ? (
                      <p className="text-white/60 text-sm">This album hasn’t been shared with anyone yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedAlbum.permissions.map((permission) => (
                          <div key={permission.granted_to_user_id} className="flex items-center justify-between bg-black/30 border border-white/10 rounded-xl px-4 py-3">
                            <div>
                              <p className="text-white text-sm font-semibold">{permission.granted_to_name}</p>
                              <p className="text-white/50 text-xs">
                                Shared {new Date(permission.granted_at).toLocaleDateString()}
                                {permission.expires_at && ` • Expires ${new Date(permission.expires_at).toLocaleDateString()}`}
                              </p>
                            </div>
                            <button
                              onClick={() => revokeAccess(selectedAlbum.id, permission.granted_to_user_id)}
                              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
