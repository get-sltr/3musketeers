'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileView {
  id: string
  viewer_id: string
  last_viewed: string
  viewer: {
    id: string
    display_name: string
    photo_url: string
    age: number
    location: string
    is_online: boolean
  }
}

export default function ViewedPage() {
  const router = useRouter()
  const supabase = createClient()
  const [views, setViews] = useState<ProfileView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfileViews()
  }, [])

  const fetchProfileViews = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          id,
          viewer_id,
          last_viewed,
          viewer:profiles!viewer_id (
            id,
            display_name,
            photo_url,
            age,
            online
          )
        `)
        .eq('viewed_user_id', user.id)
        .order('last_viewed', { ascending: false })
        .limit(100)

      if (error) throw error

      const typedViews: ProfileView[] = (data || []).map((row: any) => ({
        id: row.id,
        viewer_id: row.viewer_id,
        last_viewed: row.last_viewed,
        viewer: {
          id: row.viewer?.id ?? '',
          display_name: row.viewer?.display_name ?? 'Member',
          photo_url: row.viewer?.photo_url ?? '',
          age: row.viewer?.age ?? 0,
          location: '', // Removed - not in profiles table
          is_online: row.viewer?.online ?? false,
        },
      }))

      setViews(typedViews)
    } catch (error) {
      console.error('Error fetching views:', error)
    } finally {
      setLoading(false)
    }
  }

  const openProfile = (userId: string) => {
    router.push(`/app?focus=${userId}`)
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
          ←
        </button>
        <h1>👀 Who Viewed You</h1>
        <div className="spacer" />
      </header>

      <main className="page-content">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <p>Loading views...</p>
          </div>
        ) : views.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👀</div>
            <h2>No views yet</h2>
            <p>When someone views your profile, they&apos;ll show up here.</p>
          </div>
        ) : (
          <div className="views-grid">
            {views.map(view => (
              <div
                key={view.id}
                className="view-card"
                onClick={() => openProfile(view.viewer_id)}
              >
                <div className="photo-container">
                  <Image
                    src={view.viewer.photo_url || '/default-avatar.png'}
                    alt={view.viewer.display_name}
                    fill
                    sizes="(max-width: 768px) 45vw, 200px"
                    className="object-cover"
                    unoptimized
                  />
                  {view.viewer.is_online && <div className="online-dot" />}
                </div>
                <div className="view-info">
                  <div className="username">
                    {view.viewer.display_name || 'Member'}
                  </div>
                  <div className="stats">
                    {view.viewer.age
                      ? `${view.viewer.age}${
                          view.viewer.location
                            ? ` • ${view.viewer.location}`
                            : ''
                        }`
                      : view.viewer.location || 'Unknown location'}
                  </div>
                  <div className="timestamp">
                    {formatTime(view.last_viewed)}
                  </div>
                </div>
              </div>
            ))}
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
          z-index: 20;
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

        .page-content {
          padding: 80px 20px 20px 20px;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #888;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 217, 255, 0.3);
          border-top-color: #00d9ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          max-width: 400px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 5em;
          margin-bottom: 24px;
          opacity: 0.3;
        }

        .views-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
        }

        .view-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .view-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 217, 255, 0.4);
          box-shadow: 0 8px 24px rgba(0, 217, 255, 0.2);
        }

        .photo-container {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
        }

        .dtfn-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 1.2em;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
          z-index: 6;
        }

        .online-dot {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00ff00;
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
          z-index: 6;
        }

        .view-info {
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

        @media (max-width: 768px) {
          .views-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
          }

          .page-content {
            padding: 15px;
          }
        }
      `}</style>
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
