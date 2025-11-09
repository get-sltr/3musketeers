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
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [albumFormName, setAlbumFormName] = useState('')
  const [albumFormDescription, setAlbumFormDescription] = useState('')
  const [albumFormPublic, setAlbumFormPublic] = useState(false)
  const [queuedPhotos, setQueuedPhotos] = useState<File[]>([])
  const [albumSaving, setAlbumSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [panelMode, setPanelMode] = useState<'idle' | 'create' | 'manage'>('idle')
  
  const supabase = createClient()

  const resetCreateForm = () => {
    setNewAlbumName('')
    setNewAlbumDescription('')
  }

  const resetManageForm = () => {
    setAlbumFormName('')
    setAlbumFormDescription('')
    setAlbumFormPublic(false)
    setQueuedPhotos([])
  }

  const hydrateAlbumForm = (album: Album) => {
    setAlbumFormName(album.name)
    setAlbumFormDescription(album.description || '')
    setAlbumFormPublic(album.is_public)
    setQueuedPhotos([])
  }

  useEffect(() => {
    if (isOpen) {
      setPanelMode('idle')
      setSelectedAlbum(null)
      resetCreateForm()
      setUploading(false)
      resetManageForm()
      loadAlbums()
    } else {
      setSelectedAlbum(null)
      setPanelMode('idle')
      resetCreateForm()
      setUploading(false)
      resetManageForm()
    }
  }, [isOpen])

  const loadAlbums = async (focusAlbumId?: string) => {
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

      const targetAlbumId = focusAlbumId || selectedAlbum?.id || null

      if (targetAlbumId) {
        const matchedAlbum = transformedAlbums.find((album) => album.id === targetAlbumId) || null
        if (matchedAlbum) {
          setSelectedAlbum(matchedAlbum)
          hydrateAlbumForm(matchedAlbum)
          if (focusAlbumId) {
            setPanelMode('manage')
          }
        } else {
          setSelectedAlbum(null)
          if (panelMode === 'manage') {
            setPanelMode('idle')
          }
          resetManageForm()
        }
      } else if (selectedAlbum) {
        setSelectedAlbum(null)
        resetManageForm()
        if (panelMode === 'manage') {
          setPanelMode('idle')
        }
      }
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

      resetCreateForm()
      await loadAlbums(data.id)
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
        await loadAlbums(albumId)
      }
    } catch (err) {
      console.error('Error updating album:', err)
    }
  }

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album)
    hydrateAlbumForm(album)
    setPanelMode('manage')
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
        await loadAlbums(selectedAlbum.id)
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
      await loadAlbums(selectedAlbum.id)
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
        await loadAlbums(albumId)
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
        await loadAlbums(albumId)
      }
    } catch (err) {
      console.error('Error revoking access:', err)
    }
  }

  const handleBackToList = () => {
    setPanelMode('idle')
    setSelectedAlbum(null)
    resetManageForm()
  }

  const closeCreatePanel = () => {
    resetCreateForm()
    setUploading(false)
    if (selectedAlbum) {
      setPanelMode('manage')
    } else {
      setPanelMode('idle')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-white">📸 Album Manager</h2>
            <p className="text-sm text-white/60">Organize your sets, upload new shots, and control who sees them.</p>
          </div>
          <button
            onClick={onClose}
            className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300"
          >
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          {/* Album list */}
          <aside className="w-full border-b border-white/10 bg-black/30 lg:w-80 lg:border-b-0 lg:border-r xl:w-96">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">Your Albums</h3>
              <button
                onClick={() => {
                  setSelectedAlbum(null)
                  resetManageForm()
                  resetCreateForm()
                  setUploading(false)
                  setPanelMode('create')
                }}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-3 py-2 text-sm font-semibold text-white transition hover:scale-105"
              >
                + New
              </button>
            </div>
            <div className="h-[1px] w-full bg-white/5" />
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-white/60">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                  <p>Loading albums...</p>
                </div>
              ) : albums.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-white/60">
                  <div className="mb-3 text-4xl">📸</div>
                  <p className="mb-3 text-sm">You haven’t created any albums yet.</p>
                  <button
                    onClick={() => {
                      setSelectedAlbum(null)
                      resetManageForm()
                      resetCreateForm()
                      setUploading(false)
                      setPanelMode('create')
                    }}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:scale-105"
                  >
                    Create your first album
                  </button>
                </div>
              ) : (
                albums.map((album) => {
                  const isActive = panelMode === 'manage' && selectedAlbum?.id === album.id
                  const coverPhoto = album.photos[0]

                  return (
                    <div
                      key={album.id}
                      className={`rounded-2xl border ${isActive ? 'border-cyan-400/70 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20'} transition`}
                    >
                      <button
                        onClick={() => handleAlbumSelect(album)}
                        className="flex w-full items-center gap-3 px-4 py-4 text-left"
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white/10">
                          {coverPhoto ? (
                            <img src={coverPhoto} alt={`${album.name} cover`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/50">
                              No Photo
                            </div>
                          )}
                          {album.is_public ? (
                            <span className="absolute bottom-1 right-1 rounded-full bg-green-500/90 px-2 text-[10px] font-semibold text-black">
                              Public
                            </span>
                          ) : (
                            <span className="absolute bottom-1 right-1 rounded-full bg-orange-500/90 px-2 text-[10px] font-semibold text-black">
                              Private
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="truncate text-sm font-semibold text-white">{album.name}</p>
                          {album.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-white/50">{album.description}</p>
                          )}
                          <div className="mt-2 text-xs text-white/50">
                            {album.photos.length} photo{album.photos.length === 1 ? '' : 's'}
                            {album.permissions.length > 0 && (
                              <span className="ml-2 text-cyan-300">
                                • {album.permissions.length} shared
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center justify-between px-4 pb-4 pt-0">
                        <span className="text-[11px] uppercase tracking-wide text-white/40">
                          Tap to manage
                        </span>
                        <button
                          onClick={() => onAlbumShare(album.id, album.name)}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                        >
                          Share
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          {/* Detail panel */}
          <section className="flex-1 overflow-y-auto bg-black/40">
            {panelMode === 'create' ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Create a New Album</h3>
                    <p className="text-sm text-white/60">Give it a name, add a vibe, and you’re ready to upload.</p>
                  </div>
                  <button
                    onClick={closeCreatePanel}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <form onSubmit={createAlbum} className="mx-auto max-w-xl space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white/80">
                        Album Name *
                      </label>
                      <input
                        type="text"
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                        placeholder="e.g., Beach Nights, Pride Weekend"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-white/80">
                        Description (optional)
                      </label>
                      <textarea
                        value={newAlbumDescription}
                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                        placeholder="Add a short description so your vibe is clear."
                      />
                    </div>
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-5 text-sm text-white/60">
                      You can upload photos right after the album is created.
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeCreatePanel}
                        className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploading || !newAlbumName.trim()}
                        className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploading ? 'Creating…' : 'Create Album'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : selectedAlbum ? (
              <div className="flex h-full flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedAlbum.name}</h3>
                    <p className="text-sm text-white/50">
                      {selectedAlbum.photos.length} photo{selectedAlbum.photos.length === 1 ? '' : 's'} •{' '}
                      {selectedAlbum.is_public ? 'Public' : 'Private'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAlbumShare(selectedAlbum.id, selectedAlbum.name)}
                      className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Share
                    </button>
                    <button
                      onClick={handleBackToList}
                      className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
                    >
                      Back to albums
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col lg:flex-row">
                  <div className="w-full border-b border-white/10 bg-white/[0.03] lg:w-[340px] lg:border-b-0 lg:border-r">
                    <div className="space-y-5 px-6 py-6">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-white/80">Album Name</label>
                        <input
                          type="text"
                          value={albumFormName}
                          onChange={(e) => setAlbumFormName(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                          placeholder="Album title"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-white/80">Description</label>
                        <textarea
                          value={albumFormDescription}
                          onChange={(e) => setAlbumFormDescription(e.target.value)}
                          rows={4}
                          className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                          placeholder="Describe this album..."
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-white/15 bg-black/30 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {albumFormPublic ? 'Public Album' : 'Private Album'}
                          </p>
                          <p className="text-xs text-white/60">
                            {albumFormPublic
                              ? 'Anyone with the link can see these photos.'
                              : 'Only you and invited members can view.'}
                          </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={albumFormPublic}
                            onChange={(e) => setAlbumFormPublic(e.target.checked)}
                          />
                          <div className={`h-6 w-12 rounded-full transition ${albumFormPublic ? 'bg-cyan-500' : 'bg-white/20'}`}>
                            <div
                              className={`h-6 w-6 rounded-full bg-white shadow transition ${albumFormPublic ? 'translate-x-6' : ''}`}
                            />
                          </div>
                        </label>
                      </div>

                      <button
                        onClick={handleAlbumSave}
                        disabled={albumSaving}
                        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {albumSaving ? 'Saving…' : 'Save Changes'}
                      </button>

                      <div className="border-t border-white/10 pt-5">
                        <label className="mb-3 block text-sm font-semibold text-white/80">Upload photos</label>
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
                            className="block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-100 hover:file:bg-cyan-500/30"
                          />
                          <p className="mt-3 text-xs text-white/50">You can select multiple files at once.</p>
                          {queuedPhotos.length > 0 && (
                            <div className="mt-4 max-h-24 space-y-2 overflow-y-auto text-left text-xs text-white/70">
                              {queuedPhotos.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
                                  <span className="truncate">{file.name}</span>
                                  <span>{Math.round(file.size / 1024)} KB</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={handleQueuedUpload}
                            disabled={photoUploading || queuedPhotos.length === 0}
                            className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {photoUploading ? 'Uploading…' : 'Upload Selected Photos'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-white">Photos</h4>
                          {selectedAlbum.photos.length > 0 && (
                            <span className="text-sm text-white/50">
                              {selectedAlbum.photos.length} total
                            </span>
                          )}
                        </div>
                        {selectedAlbum.photos.length === 0 ? (
                          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/25 py-12 text-white/60">
                            <div className="mb-3 text-4xl">🖼️</div>
                            <p className="text-sm">No photos yet. Upload to bring this album to life.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {selectedAlbum.photos.map((photo, index) => (
                              <div key={index} className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                <img src={photo} alt={`Album photo ${index + 1}`} className="h-full w-full object-cover" />
                                <button
                                  onClick={() => handlePhotoRemove(selectedAlbum.id, photo)}
                                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-red-500/80"
                                  title="Remove photo"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-white">Sharing Access</h4>
                          {selectedAlbum.permissions.length > 0 && (
                            <span className="text-sm text-white/50">
                              {selectedAlbum.permissions.length} member{selectedAlbum.permissions.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        {selectedAlbum.permissions.length === 0 ? (
                          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-6 text-sm text-white/60">
                            This album hasn’t been shared with anyone yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedAlbum.permissions.map((permission) => (
                              <div
                                key={permission.granted_to_user_id}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-white">{permission.granted_to_name}</p>
                                  <p className="text-xs text-white/50">
                                    Shared {new Date(permission.granted_at).toLocaleDateString()}
                                    {permission.expires_at && ` • Expires ${new Date(permission.expires_at).toLocaleDateString()}`}
                                  </p>
                                </div>
                                <button
                                  onClick={() => revokeAccess(selectedAlbum.id, permission.granted_to_user_id)}
                                  className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/30"
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
            ) : loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-white/60">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
                <p>Loading albums…</p>
              </div>
            ) : albums.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white/60">
                <div className="text-5xl">✨</div>
                <p className="text-lg font-semibold text-white">No albums yet</p>
                <p className="max-w-sm text-sm">
                  Build your first collection to showcase your best photos. Tap “Create your first album” on the left to begin.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-white/60">
                <div className="text-5xl">👈</div>
                <p className="text-lg font-semibold text-white">Select an album</p>
                <p className="max-w-sm text-sm">
                  Choose an album from the list to manage details, upload photos, or control who has access.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
