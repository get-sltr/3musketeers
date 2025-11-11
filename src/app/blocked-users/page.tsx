'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getBlockedUsers, unblockUser, type BlockedUser } from '@/lib/safety'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { resolveProfilePhoto } from '@/lib/utils/profile'

interface BlockedUserWithProfile extends BlockedUser {
  display_name?: string
  photo_url?: string
  photos?: string[]
}

export default function BlockedUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserWithProfile[]>([])
  const [unblocking, setUnblocking] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndFetchBlocked()
  }, [])

  const checkAuthAndFetchBlocked = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    await fetchBlockedUsers()
    setLoading(false)
  }

  const fetchBlockedUsers = async () => {
    const blocked = await getBlockedUsers()

    if (blocked.length === 0) {
      setBlockedUsers([])
      return
    }

    // Fetch profile data for blocked users
    const supabase = createClient()
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, photo_url, photos')
      .in('id', blocked.map(b => b.userId))

    // Merge blocked data with profile data
    const blockedWithProfiles = blocked.map(b => {
      const profile = profiles?.find(p => p.id === b.userId)
      return {
        ...b,
        display_name: profile?.display_name || 'Unknown User',
        photo_url: profile?.photo_url,
        photos: profile?.photos
      }
    })

    setBlockedUsers(blockedWithProfiles)
  }

  const handleUnblock = async (userId: string) => {
    setUnblocking(userId)
    const result = await unblockUser(userId)

    if (result.success) {
      // Remove from list
      setBlockedUsers(prev => prev.filter(u => u.userId !== userId))
    } else {
      alert(result.error || 'Failed to unblock user')
    }

    setUnblocking(null)
  }

  if (loading) {
    return <LoadingSkeleton variant="fullscreen" />
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Blocked Users</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-4 max-w-5xl mx-auto pb-20">
        {blockedUsers.length === 0 ? (
          // Empty state
          <div className="glass-bubble p-12 text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Blocked Users</h2>
            <p className="text-white/60">
              You haven't blocked anyone yet. When you block someone, they'll appear here.
            </p>
          </div>
        ) : (
          // Blocked users list
          <div className="space-y-4">
            <div className="glass-bubble p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-2">
                Blocked Users ({blockedUsers.length})
              </h2>
              <p className="text-white/60 text-sm">
                Blocked users can't see your profile, send you messages, or interact with you on SLTR.
              </p>
            </div>

            {blockedUsers.map(user => {
              const photoUrl = resolveProfilePhoto(user)

              return (
                <div
                  key={user.userId}
                  className="glass-bubble p-4 flex items-center gap-4 hover:bg-white/5 transition-all"
                >
                  {/* Profile Photo */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={user.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {user.display_name}
                    </h3>
                    <p className="text-sm text-white/50">
                      Blocked {user.blockedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    {user.reason && (
                      <p className="text-xs text-white/40 mt-1 truncate">
                        Reason: {user.reason}
                      </p>
                    )}
                  </div>

                  {/* Unblock Button */}
                  <button
                    onClick={() => handleUnblock(user.userId)}
                    disabled={unblocking === user.userId}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 rounded-xl text-white font-semibold text-sm transition-all disabled:cursor-not-allowed"
                  >
                    {unblocking === user.userId ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Unblocking...
                      </span>
                    ) : (
                      'Unblock'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, #00d4ff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-bubble {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}
