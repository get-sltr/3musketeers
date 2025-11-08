'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ProfileView {
  id: string
  viewer_id: string
  viewed_at: string
  viewer: {
    username: string
    age: number
    position: string
    distance: number
    photo_url: string
    is_online: boolean
    dtfn: boolean
  }
}

export default function ViewedPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
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
          viewed_at,
          viewer:profiles!viewer_id (
            username,
            age,
            position,
            distance,
            photo_url,
            is_online,
            dtfn
          )
        `)
        .eq('viewed_user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setViews(data || [])
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
                    alt={view.viewer.username}
                    fill
                    sizes="(max-width: 768px) 45vw, 200px"
                    className="object-cover"
                    unoptimized
                  />
                  {view.viewer.dtfn && <div className="dtfn-badge">⚡</div>}
                  {view.viewer.is_online && <div className="online-dot" />}
                </div>

          ... (truncated) ...``` Wait patch truncated due to char? Need include rest code. change approach: we should include entire file in one patch. start over carefully ensure style etc. Start new apply patch rewriting file content fully.

