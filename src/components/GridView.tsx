'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { resolveProfilePhoto } from '@/lib/utils/profile'
import UserProfileModal from './UserProfileModal'
import MessagingModal from './MessagingModal'
import AgeFilterModal from '@/app/components/filters/AgeFilterModal'
import PositionFilterModal from '@/app/components/filters/PositionFilterModal'
import Modal from '@/app/components/ui/Modal'

interface User {
  id: string
  username: string
  display_name?: string
  age: number
  photo?: string
  photos?: string[]
  distance: string
  distanceMiles?: number | null
  isOnline: boolean
  bio?: string
  position?: string
  party_friendly?: boolean
  dtfn?: boolean
  latitude?: number
  longitude?: number
  tags?: string[]
  isFavorited?: boolean
}

interface GridViewProps {
  onUserClick?: (userId: string) => void
}

const MAX_GRID_DISTANCE_MILES = 10
const DEFAULT_AGE_RANGE = { min: 18, max: 99 }

const FILTER_BUTTONS = [
  { id: 'online', label: 'Online' },
  { id: 'age', label: 'Age' },
  { id: 'position', label: 'Position' },
  { id: 'tags', label: 'Tags' },
  { id: 'dtfn', label: '⚡' },
]

const GLASS_CLASSES = [
  'glass-gradient-1',
  'glass-magenta',
  'glass-purple',
  'glass-cyan',
  'glass-orange',
  'glass-blue',
]

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const formatDistance = (distanceMiles: number | null | undefined) => {
  if (distanceMiles == null || Number.isNaN(distanceMiles)) return ''
  if (distanceMiles < 0.1) return '<0.1 mi'
  if (distanceMiles < 10) return `${distanceMiles.toFixed(1)} mi`
  return `${Math.round(distanceMiles)} mi`
}

export default function GridView({ onUserClick }: GridViewProps) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMessagingOpen, setIsMessagingOpen] = useState(false)
  const [messagingUser, setMessagingUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [activeButtons, setActiveButtons] = useState<string[]>([])
  const [ageRange, setAgeRange] = useState(DEFAULT_AGE_RANGE)
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAgeModal, setShowAgeModal] = useState(false)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        let currentUserLat: number | null = null
        let currentUserLon: number | null = null

        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading profiles:', error)
          return
        }

        const cleanedProfiles = profiles || []

        const currentProfile = cleanedProfiles.find(
          profile => profile.id === currentUser?.id
        )

        if (currentProfile?.latitude && currentProfile?.longitude) {
          currentUserLat = currentProfile.latitude
          currentUserLon = currentProfile.longitude
        }

        let userList: User[] =
          cleanedProfiles?.map(profile => {
            const hasCoords =
              typeof profile.latitude === 'number' &&
              typeof profile.longitude === 'number' &&
              profile.latitude !== null &&
              profile.longitude !== null

            const distanceMiles =
              hasCoords && currentUserLat != null && currentUserLon != null
                ? haversineDistance(
                    currentUserLat,
                    currentUserLon,
                    profile.latitude,
                    profile.longitude
                  )
                : null

            const isSelf = profile.id === currentUser?.id
            return {
              id: profile.id,
              username: profile.username || profile.display_name || 'User',
              display_name: profile.display_name || profile.username || 'User',
              age: profile.age || 0,
              photo: resolveProfilePhoto(profile.photo_url, profile.photos),
              photos: Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : [],
              distance: isSelf ? 'You' : formatDistance(distanceMiles),
              distanceMiles: isSelf ? 0 : distanceMiles,
              isOnline: profile.online || profile.is_online || false,
              bio: profile.about || '',
              position: profile.position,
              party_friendly: profile.party_friendly || false,
              dtfn: profile.dtfn || false,
              tags: profile.tags || [],
              latitude: profile.latitude ?? undefined,
              longitude: profile.longitude ?? undefined,
            }
          }) || []

        userList = userList.filter(user => {
          if (user.id === currentUser?.id) return true
          if (user.distanceMiles == null) return true
          return user.distanceMiles <= MAX_GRID_DISTANCE_MILES
        })

        if (currentUser) {
          userList = userList.sort((a, b) => {
            if (a.id === currentUser.id) return -1
            if (b.id === currentUser.id) return 1
            if (a.distanceMiles != null && b.distanceMiles != null) {
              return a.distanceMiles - b.distanceMiles
            }
            return 0
          })
        }

        if (currentUser) {
          const { data: favoritesRows } = await supabase
            .from('favorites')
            .select('favorited_user_id')
            .eq('user_id', currentUser.id)

          const favoriteIds = new Set<string>()
          for (const row of favoritesRows || []) {
            if (row?.favorited_user_id) favoriteIds.add(row.favorited_user_id)
          }

          userList = userList.map(user => ({
            ...user,
            isFavorited: favoriteIds.has(user.id),
          }))
        }

        setUsers(userList)
      } catch (err) {
        console.error('Error loading users:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [supabase])

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    users.forEach(user => {
      user.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [users])

  useEffect(() => {
    let filtered = [...users]

    if (activeButtons.includes('online')) {
      filtered = filtered.filter(user => user.isOnline)
    }

    if (activeButtons.includes('dtfn')) {
      filtered = filtered.filter(user => user.dtfn)
    }

    filtered = filtered.filter(user => {
      if (!user.age) return true
      return user.age >= ageRange.min && user.age <= ageRange.max
    })

    if (selectedPositions.length > 0) {
      filtered = filtered.filter(user => {
        if (!user.position) return selectedPositions.includes('Not Specified')
        const userPos = user.position
        return selectedPositions.some(pos => {
          if (userPos === pos) return true
          if (
            pos === 'Vers/Top' &&
            (userPos === 'Vers/Top' ||
              userPos === 'Vers Top' ||
              (userPos?.includes('Vers') && userPos?.includes('Top')))
          )
            return true
          if (
            pos === 'Vers/Btm' &&
            (userPos === 'Vers/Btm' ||
              userPos === 'Vers Bottom' ||
              (userPos?.includes('Vers') && userPos?.includes('Bottom')))
          )
            return true
          return userPos?.toLowerCase().includes(pos.toLowerCase())
        })
      })
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(user => {
        if (!user.tags || user.tags.length === 0) return false
        const normalized = user.tags.map(tag => tag.toLowerCase())
        return selectedTags.every(tag =>
          normalized.includes(tag.toLowerCase())
        )
      })
    }

    setFilteredUsers(filtered)
  }, [users, activeButtons, ageRange, selectedPositions, selectedTags])

  const isDefaultAgeRange =
    ageRange.min === DEFAULT_AGE_RANGE.min && ageRange.max === DEFAULT_AGE_RANGE.max

  const toggleFilterButton = (id: string) => {
    if (id === 'age') {
      setShowAgeModal(true)
      return
    }
    if (id === 'position') {
      setShowPositionModal(true)
      return
    }
    if (id === 'tags') {
      setShowTagModal(true)
      return
    }

    setActiveButtons(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setSelectedUser(user)
      setIsModalOpen(true)
      onUserClick?.(userId)
    }
  }

  const handleMessage = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setMessagingUser(user)
      setIsModalOpen(false)
      setIsMessagingOpen(true)
    }
  }

  const handleToggleFavorite = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('User not authenticated')
        return
      }

      const { data: existingFavorite } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('favorited_user_id', userId)
        .maybeSingle()

      if (existingFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id)

        if (error) {
          console.error('Error removing favorite:', error)
          alert('Failed to remove favorite. Please try again.')
        } else {
          setUsers(prev =>
            prev.map(u =>
              u.id === userId ? { ...u, isFavorited: false } : u
            )
          )
        }
      } else {
        const insertData = {
          user_id: user.id,
          created_at: new Date().toISOString(),
          favorited_user_id: userId,
        }

        const { error: insertError } = await supabase
          .from('favorites')
          .insert(insertData)

        if (insertError) {
          console.error('Error adding favorite:', insertError)
          alert(
            `Failed to add favorite: ${insertError.message}. Please check if the favorites table exists.`
          )
        } else {
          setUsers(prev =>
            prev.map(u =>
              u.id === userId ? { ...u, isFavorited: true } : u
            )
          )
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert('Failed to toggle favorite. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading users...</div>
      </div>
    )
  }

  return (
    <>
      <div className="grid-container">
        <header className="filter-header">
          {FILTER_BUTTONS.map(button => {
            const isActive =
              button.id === 'age'
                ? !isDefaultAgeRange
                : button.id === 'position'
                ? selectedPositions.length > 0
                : button.id === 'tags'
                ? selectedTags.length > 0
                : activeButtons.includes(button.id)
            return (
              <button
                key={button.id}
                className={`filter-btn ${isActive ? 'active' : ''}`}
                onClick={() => toggleFilterButton(button.id)}
              >
                {button.label}
              </button>
            )
          })}
        </header>

        <main className="main-content">
          {filteredUsers.length === 0 ? (
            <div className="empty-grid">
              <div className="empty-icon">🛰️</div>
              <h2>No users match your filters</h2>
              <p>Try resetting or adjusting your filters.</p>
            </div>
          ) : (
            <div className="profile-grid">
              {filteredUsers.map((user, index) => {
                const colorClass =
                  GLASS_CLASSES[index % GLASS_CLASSES.length]
                return (
                  <div
                    key={user.id}
                    className="profile-card"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <div className="photo-container">
                      <Image
                        src={user.photo || '/default-avatar.png'}
                        alt={user.username}
                        fill
                        sizes="(max-width: 768px) 45vw, 240px"
                        className="profile-photo"
                        unoptimized
                      />

                      {user.dtfn && (
                        <div className="dtfn-badge">⚡</div>
                      )}
                      {user.isOnline && <div className="online-dot" />}
                      <button
                        className="favorite-btn"
                        onClick={e => {
                          e.stopPropagation()
                          handleToggleFavorite(user.id)
                        }}
                        aria-label="Toggle favorite"
                      >
                        {user.isFavorited ? '✨' : '☆'}
                      </button>

                      <div className={`glass-info-bar ${colorClass}`}>
                        <span className="info-text">
                          <span className="info-username">
                            {user.username}
                          </span>
                          {user.age > 0 && (
                            <>
                              {user.age}
                              <span className="info-separator">•</span>
                            </>
                          )}
                          {user.position && (
                            <>
                              {user.position}
                              <span className="info-separator">•</span>
                            </>
                          )}
                          {user.distance}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      <AgeFilterModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onApply={(min, max) => {
          setAgeRange({ min, max })
          if (!activeButtons.includes('age')) {
            setActiveButtons(prev => [...prev, 'age'])
          }
        }}
        currentMin={ageRange.min}
        currentMax={ageRange.max}
      />

      <PositionFilterModal
        isOpen={showPositionModal}
        onClose={() => setShowPositionModal(false)}
        onApply={positions => {
          setSelectedPositions(positions)
          if (positions.length === 0) {
            setActiveButtons(prev => prev.filter(f => f !== 'position'))
          } else if (!activeButtons.includes('position')) {
            setActiveButtons(prev => [...prev, 'position'])
          }
        }}
        currentPositions={selectedPositions}
      />

      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="Filter by Tags"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={tagSearch}
            onChange={e => setTagSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition"
          />
          <div className="tag-list">
            {availableTags
              .filter(tag =>
                tag.toLowerCase().includes(tagSearch.toLowerCase())
              )
              .map(tag => {
                const isActive = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )
                    }}
                    className={`tag-pill ${isActive ? 'active' : ''}`}
                  >
                    {tag}
                  </button>
                )
              })}
            {availableTags.length === 0 && (
              <p className="text-white/60 text-sm text-center py-4">
                No tags found yet. Tags will appear as members add them.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedTags([])
                setActiveButtons(prev => prev.filter(f => f !== 'tags'))
              }}
              className="flex-1 glass-bubble py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              Clear
            </button>
            <button
              onClick={() => {
                if (selectedTags.length > 0 && !activeButtons.includes('tags')) {
                  setActiveButtons(prev => [...prev, 'tags'])
                }
                if (selectedTags.length === 0) {
                  setActiveButtons(prev => prev.filter(f => f !== 'tags'))
                }
                setShowTagModal(false)
              }}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 py-3 rounded-xl text-white font-semibold hover:scale-105 transition"
            >
              Apply
            </button>
          </div>
        </div>
      </Modal>

      <UserProfileModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMessage={handleMessage}
        onBlock={userId => console.log('Block user:', userId)}
        onReport={userId => console.log('Report user:', userId)}
        onFavorite={handleToggleFavorite}
        isFavorited={
          selectedUser
            ? users.find(u => u.id === selectedUser.id)?.isFavorited
            : false
        }
      />

      {isMessagingOpen && messagingUser && (
        <MessagingModal
          user={messagingUser}
          isOpen={isMessagingOpen}
          onClose={() => {
            setIsMessagingOpen(false)
            setMessagingUser(null)
          }}
        />
      )}

      <style jsx>{`
        .grid-container {
          background: #000;
          min-height: 100vh;
        }

        .filter-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 10px;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(18px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          overflow-x: auto;
        }

        .filter-btn {
          padding: 6px 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 0.8em;
          font-weight: 500;
          white-space: nowrap;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          background: rgba(0, 217, 255, 0.2);
          border-color: #00d9ff;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%);
          border-color: transparent;
        }

        .main-content {
          padding: 8px 6px 100px;
          min-height: calc(100vh - 56px);
        }

        .profile-grid {
          columns: 3;
          column-gap: 4px;
        }

        .profile-card {
          position: relative;
          break-inside: avoid;
          margin-bottom: 4px;
          border-radius: 12px;
          overflow: visible;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          transition: transform 0.2s ease;
          cursor: pointer;
        }

        .profile-card:hover {
          transform: scale(1.02);
        }

        .photo-container {
          position: relative;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
        }

        .profile-photo {
          object-fit: cover;
        }

        .glass-info-bar {
          position: absolute;
          left: 6px;
          right: 6px;
          bottom: 4px;
          padding: 6px 10px;
          border-radius: 10px;
          backdrop-filter: blur(18px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
        }

        .glass-gradient-1 {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.3), rgba(255, 0, 255, 0.35));
          border-color: rgba(0, 217, 255, 0.55);
        }
        .glass-magenta {
          background: rgba(255, 0, 255, 0.3);
          border-color: rgba(255, 0, 255, 0.55);
        }
        .glass-purple {
          background: rgba(118, 75, 226, 0.3);
          border-color: rgba(118, 75, 226, 0.55);
        }
        .glass-cyan {
          background: rgba(0, 217, 255, 0.28);
          border-color: rgba(0, 217, 255, 0.5);
        }
        .glass-orange {
          background: rgba(250, 112, 154, 0.28);
          border-color: rgba(250, 112, 154, 0.55);
        }
        .glass-blue {
          background: rgba(79, 172, 254, 0.28);
          border-color: rgba(79, 172, 254, 0.5);
        }

        .info-text {
          color: white;
          font-size: 0.72em;
          font-weight: 500;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
          display: inline-flex;
          align-items: center;
          gap: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .info-username {
          font-weight: 600;
          margin-right: 4px;
        }

        .info-separator {
          opacity: 0.75;
          margin: 0 3px;
        }

        .dtfn-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          font-size: 1.4em;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
          z-index: 5;
        }

        .online-dot {
          position: absolute;
          top: 6px;
          left: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00ff00;
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
          z-index: 5;
        }

        .favorite-btn {
          position: absolute;
          top: 6px;
          right: 40px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 1em;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 6;
          transition: all 0.2s ease;
        }

        .favorite-btn:hover {
          background: rgba(0, 217, 255, 0.3);
          border-color: rgba(0, 217, 255, 0.6);
        }

        .empty-grid {
          text-align: center;
          padding: 80px 20px;
          color: white;
        }

        .empty-icon {
          font-size: 4em;
          opacity: 0.35;
          margin-bottom: 16px;
        }

        .tag-list {
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-pill {
          padding: 8px 14px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: #eee;
          font-size: 0.85em;
          transition: all 0.2s ease;
        }

        .tag-pill.active {
          background: rgba(0, 217, 255, 0.3);
          border-color: rgba(0, 217, 255, 0.6);
          color: white;
        }

        @media (max-width: 1024px) {
          .profile-grid {
            columns: 2;
          }
        }

        @media (max-width: 768px) {
          .profile-grid {
            columns: 2;
            column-gap: 3px;
          }

          .profile-card {
            margin-bottom: 3px;
          }
        }

        @media (max-width: 480px) {
          .profile-grid {
            columns: 2;
          }

          .filter-btn {
            padding: 5px 12px;
            font-size: 0.75em;
          }

          .main-content {
            padding-bottom: 120px;
          }
        }
      `}</style>
    </>
  )
}
