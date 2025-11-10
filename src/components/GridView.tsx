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
  eta?: string
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

const calculateETA = (distanceMiles: number | null | undefined) => {
  if (distanceMiles == null || Number.isNaN(distanceMiles)) return ''
  // Walking speed: 3 mph
  const walkingMinutes = (distanceMiles / 3) * 60
  if (walkingMinutes < 1) return '<1m'
  if (walkingMinutes < 60) return `${Math.round(walkingMinutes)}m`
  const hours = Math.floor(walkingMinutes / 60)
  const mins = Math.round(walkingMinutes % 60)
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
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
              eta: isSelf ? '' : calculateETA(distanceMiles),
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
                        src={user.photo || '/placeholder-profile.svg'}
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

                      <div className={`glass-info-bar ${colorClass}`}>
                        <span className="info-text">
                          {user.username} • {user.distance}{user.eta && ` • ${user.eta}`}
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
          background: #0a0a0f;
          min-height: 100vh;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-header {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 8px;
          background: linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(10, 10, 15, 0.95) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 2px solid transparent;
          border-image: linear-gradient(90deg, rgba(255, 0, 255, 0.3), rgba(0, 217, 255, 0.3), rgba(255, 0, 255, 0.3)) 1;
          overflow-x: auto;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 0, 255, 0.1);
        }

        .filter-btn {
          padding: 10px 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          font-size: 1rem;
          font-weight: 800;
          white-space: nowrap;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.02em;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .filter-btn:hover {
          background: rgba(0, 217, 255, 0.15);
          border-color: rgba(0, 217, 255, 0.5);
          color: #00d9ff;
          text-shadow: 0 0 15px rgba(0, 217, 255, 0.8);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 217, 255, 0.3);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, rgba(255, 0, 255, 0.3), rgba(138, 43, 226, 0.3));
          border-color: rgba(255, 0, 255, 0.6);
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255, 0, 255, 1);
          box-shadow: 0 0 24px rgba(255, 0, 255, 0.5);
        }

        .main-content {
          padding: 0px 0px 100px 0px;
          min-height: calc(100vh - 56px);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
        }

        .profile-card {
          position: relative;
          border-radius: 0px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.8);
          background: rgba(5, 5, 8, 0.95);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          box-shadow:
            0 0 30px rgba(255, 255, 255, 0.4),
            inset 0 0 60px rgba(255, 255, 255, 0.05),
            0 8px 32px rgba(0, 0, 0, 0.8);
          animation: fadeInUp 0.5s ease-out backwards;
        }

        .profile-card:nth-child(1) { animation-delay: 0.05s; }
        .profile-card:nth-child(2) { animation-delay: 0.1s; }
        .profile-card:nth-child(3) { animation-delay: 0.15s; }
        .profile-card:nth-child(4) { animation-delay: 0.2s; }
        .profile-card:nth-child(5) { animation-delay: 0.25s; }
        .profile-card:nth-child(6) { animation-delay: 0.3s; }

        .profile-card:hover {
          transform: scale(1.03);
          border: 2px solid rgba(0, 217, 255, 1);
          box-shadow:
            0 0 60px rgba(0, 217, 255, 0.9),
            0 0 120px rgba(0, 217, 255, 0.5),
            inset 0 0 80px rgba(0, 217, 255, 0.1),
            0 12px 48px rgba(0, 0, 0, 0.9);
          z-index: 10;
        }

        .profile-card:active {
          transform: translateY(-2px) scale(1.01);
        }

        .photo-container {
          position: relative;
          width: 100%;
          aspect-ratio: 3/4;
          border-radius: 0;
          overflow: hidden;
        }

        .profile-photo {
          object-fit: cover;
          object-position: center;
        }

        .glass-info-bar {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 8px 10px;
          border-radius: 0;
          backdrop-filter: blur(24px) saturate(200%);
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          display: flex;
          align-items: center;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%);
        }

        .glass-gradient-1 {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.35), rgba(255, 0, 255, 0.4));
          border-color: rgba(0, 217, 255, 0.7);
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
        }
        .glass-magenta {
          background: linear-gradient(135deg, rgba(255, 0, 255, 0.35), rgba(138, 43, 226, 0.35));
          border-color: rgba(255, 0, 255, 0.7);
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
        }
        .glass-purple {
          background: linear-gradient(135deg, rgba(138, 43, 226, 0.35), rgba(75, 0, 130, 0.35));
          border-color: rgba(138, 43, 226, 0.7);
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
        }
        .glass-cyan {
          background: linear-gradient(135deg, rgba(0, 217, 255, 0.35), rgba(0, 191, 255, 0.35));
          border-color: rgba(0, 217, 255, 0.7);
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
        }
        .glass-orange {
          background: linear-gradient(135deg, rgba(250, 112, 154, 0.35), rgba(255, 99, 132, 0.35));
          border-color: rgba(250, 112, 154, 0.7);
          box-shadow: 0 0 20px rgba(250, 112, 154, 0.3);
        }
        .glass-blue {
          background: linear-gradient(135deg, rgba(79, 172, 254, 0.35), rgba(58, 134, 255, 0.35));
          border-color: rgba(79, 172, 254, 0.7);
          box-shadow: 0 0 20px rgba(79, 172, 254, 0.3);
        }

        .info-text {
          color: white;
          font-size: 0.8em;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        .info-username {
          font-weight: 600;
          margin-right: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }

        .info-separator {
          opacity: 0.75;
          margin: 0 3px;
        }

        .dtfn-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 1.1em;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.9));
          z-index: 5;
        }

        .online-dot {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ff00;
          border: 2px solid white;
          box-shadow:
            0 0 12px rgba(0, 255, 0, 0.8),
            0 0 24px rgba(0, 255, 0, 0.4);
          z-index: 5;
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

        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 3px;
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
