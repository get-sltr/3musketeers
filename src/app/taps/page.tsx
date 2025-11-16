'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { removeTap } from '@/lib/profileTracking'

type TabType = 'my_taps' | 'tapped_me' | 'mutual'

interface TapUserSummary {
  id: string
  display_name: string | null
  username: string | null
  age: number | null
  position: string | null
  photo_url: string | null
  is_online: boolean | null
  dtfn: boolean | null
}

interface TapRecord {
  id: string
  tapper_id: string
  tapped_user_id: string
  tapped_at: string
  is_mutual: boolean
  tapped_user?: TapUserSummary | null
  tapper?: TapUserSummary | null
}

const profileFields = `
  id,
  display_name,
  username,
  age,
  position,
  photo_url,
  is_online,
  dtfn
`

export default function TapsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabType>('my_taps')
  const [taps, setTaps] = useState<TapRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTaps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fetchTaps = async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let query: any

      if (activeTab === 'my_taps') {
        query = supabase
          .from('taps')
          .select(
            `
            id,
            tapper_id,
            tapped_user_id,
            tapped_at,
            is_mutual,
            tapped_user:profiles!tapped_user_id (${profileFields})
          `
          )
          .eq('tapper_id', user.id)
      } else if (activeTab === 'tapped_me') {
        query = supabase
          .from('taps')
          .select(
            `
            id,
            tapper_id,
            tapped_user_id,
            tapped_at,
            is_mutual,
            tapper:profiles!tapper_id (${profileFields})
          `
          )
          .eq('tapped_user_id', user.id)
      } else {
        query = supabase
          .from('taps')
          .select(
            `
            id,
            tapper_id,
            tapped_user_id,
            tapped_at,
            is_mutual,
            tapped_user:profiles!tapped_user_id (${profileFields})
          `
          )
          .eq('tapper_id', user.id)
          .eq('is_mutual', true)
      }

      const { data, error } = await query
        .order('tapped_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setTaps((data as TapRecord[]) || [])
    } catch (err: any) {
      console.error('Error fetching taps:', err)
      setError(err?.message || 'Failed to load taps')
      setTaps([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTap = async (tap: TapRecord) => {
    const targetId = tap.tapped_user_id
    if (!targetId) return
    const confirmation = confirm('Remove this tap?')
    if (!confirmation) return

    const result = await removeTap(targetId)
    if (result.success) {
      setTaps(prev => prev.filter(t => t.id !== tap.id))
    } else {
      alert('Unable to remove tap. Please try again.')
    }
  }

  const openProfile = (user: TapUserSummary | null | undefined) => {
    if (!user?.id) return
    router.push(`/app?focus=${user.id}`)
  }

  const renderedTaps = useMemo(() => taps || [], [taps])

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
          ←
        </button>
        <h1>😈 Taps</h1>
        <div className="spacer" />
      </header>

      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'my_taps' ? 'active' : ''}`}
          onClick={() => setActiveTab('my_taps')}
        >
          My Taps
        </button>
        <button
          className={`tab ${activeTab === 'tapped_me' ? 'active' : ''}`}
          onClick={() => setActiveTab('tapped_me')}
        >
          Tapped Me
        </button>
        <button
          className={`tab ${activeTab === 'mutual' ? 'active' : ''}`}
          onClick={() => setActiveTab('mutual')}
        >
          Mutual
        </button>
      </div>

      <main className="page-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <p>Loading taps...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchTaps}>
              Try Again
            </button>
          </div>
        ) : renderedTaps.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="taps-grid">
            {renderedTaps.map(tap => {
              const target =
                activeTab === 'tapped_me' ? tap.tapper : tap.tapped_user
              if (!target) return null

              return (
                <div key={tap.id} className="tap-card">
                  <div
                    className="photo-container"
                    onClick={() => openProfile(target)}
                  >
                    <Image
                      src={target.photo_url || '/default-avatar.png'}
                      alt={target.display_name || target.username || 'User'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 45vw, 200px"
                      unoptimized
                    />
                    {tap.is_mutual && <div className="mutual-badge">💞</div>}
                    {target.dtfn && <div className="dtfn-badge">⚡</div>}
                    {target.is_online && <div className="online-dot" />}
                  </div>

                  <div className="tap-info">
                    <div className="username">
                      {target.display_name || target.username || 'Member'}
                    </div>
                    <div className="stats">
                      {target.age ? `${target.age} • ` : ''}
                      {target.position || '—'}
                    </div>
                    <div className="timestamp">
                      {formatTime(tap.tapped_at)}
                    </div>
                  </div>

                  {activeTab === 'my_taps' && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveTap(tap)}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <style jsx>{`
        .page-container {
          background: #000;
          min-height: 100vh;
          color: white;
        }

        .page-header {
          position: sticky;
          top: 0;
          height: 60px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 30;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2em;
          color: white;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(0, 217, 255, 0.3);
          border-color: #00d9ff;
        }

        .page-header h1 {
          font-size: 1.2em;
          font-weight: 600;
        }

        .spacer {
          width: 40px;
        }

        .tabs-container {
          position: sticky;
          top: 60px;
          display: flex;
          gap: 2px;
          background: rgba(0, 0, 0, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 25;
        }

        .tab {
          flex: 1;
          padding: 12px 0;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #888;
          font-size: 0.9em;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab.active {
          color: white;
          border-bottom-color: #00d9ff;
        }

        .page-content {
          padding: 20px;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #aaa;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 217, 255, 0.3);
          border-top-color: #00d9ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-icon {
          font-size: 4.5em;
          opacity: 0.35;
          margin-bottom: 16px;
        }

        .retry-btn {
          margin-top: 16px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(0, 217, 255, 0.25);
          border: 1px solid rgba(0, 217, 255, 0.45);
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .retry-btn:hover {
          background: rgba(0, 217, 255, 0.4);
        }

        .taps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }

        .tap-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .tap-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 217, 255, 0.45);
          box-shadow: 0 8px 20px rgba(0, 217, 255, 0.15);
        }

        .photo-container {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
        }

        .mutual-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          font-size: 1.5em;
          z-index: 6;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
        }

        .dtfn-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 1.2em;
          z-index: 6;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
        }

        .online-dot {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00ff00;
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
          z-index: 6;
        }

        .tap-info {
          padding: 12px;
        }

        .username {
          font-weight: 600;
          font-size: 0.95em;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stats {
          font-size: 0.8em;
          color: #aaa;
          margin-bottom: 6px;
        }

        .timestamp {
          font-size: 0.75em;
          color: #666;
        }

        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1px solid rgba(255, 0, 0, 0.7);
          background: rgba(255, 0, 0, 0.6);
          color: white;
          font-size: 1.4em;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          opacity: 0;
          transition: all 0.2s ease;
        }

        .tap-card:hover .remove-btn {
          opacity: 1;
        }

        .remove-btn:hover {
          background: rgba(255, 0, 0, 0.8);
        }

        @media (max-width: 768px) {
          .page-content {
            padding: 16px;
          }
          .taps-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `}</style>
    </div>
  )
}

function EmptyState({ tab }: { tab: TabType }) {
  const icon = tab === 'my_taps' ? '❤️' : tab === 'tapped_me' ? '💕' : '💞'
  const title =
    tab === 'my_taps'
      ? 'No taps yet'
      : tab === 'tapped_me'
      ? 'No one tapped you yet'
      : 'No mutual taps yet'
  const description =
    tab === 'my_taps'
      ? "Tap on profiles you like to let them know you're interested."
      : tab === 'tapped_me'
      ? "When someone taps your profile, they'll show up here."
      : "When you and someone else tap each other, it's a match!"

  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

function formatTime(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now.getTime() - time.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return time.toLocaleDateString()
}

