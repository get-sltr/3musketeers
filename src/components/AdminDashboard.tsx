'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface UserStat {
  stat_name: string
  stat_value: number
}

interface RecentUser {
  id: string
  username: string
  display_name: string
  photo_url: string | null
  created_at: string
  is_online: boolean
  founder_number: number | null
  latitude: number | null
  longitude: number | null
}

export default function AdminDashboard() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStat[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [selectedTab, setSelectedTab] = useState<'stats' | 'users'>('stats')

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', session.user.id)
      .single()

    setIsAdmin(profile?.is_super_admin === true)
    setLoading(false)

    if (profile?.is_super_admin === true) {
      fetchStats(session.user.id)
      fetchRecentUsers(session.user.id)
    }
  }

  const fetchStats = async (userId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_user_statistics', {
      p_admin_id: userId
    })

    if (!error && data) {
      setStats(data)
    }
  }

  const fetchRecentUsers = async (userId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_recent_registrations', {
      p_admin_id: userId,
      p_limit: 20
    })

    if (!error && data) {
      setRecentUsers(data)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) return null
  if (!isAdmin) return null

  return (
    <>
      {/* Admin Button - Top Right Corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-purple-600 border-2 border-white/20 flex items-center justify-center shadow-2xl hover:scale-110 transition-all"
        title="Admin Dashboard"
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </button>

      {/* Admin Dashboard Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
            />

            {/* Dashboard Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 border-l border-red-500/30 z-[70] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Super Admin</h2>
                      <p className="text-xs text-white/60">Dashboard & Analytics</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setSelectedTab('stats')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      selectedTab === 'stats'
                        ? 'bg-gradient-to-r from-red-500 to-purple-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    📊 Statistics
                  </button>
                  <button
                    onClick={() => setSelectedTab('users')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                      selectedTab === 'users'
                        ? 'bg-gradient-to-r from-red-500 to-purple-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    👥 Recent Users
                  </button>
                </div>

                {/* Content */}
                {selectedTab === 'stats' && (
                  <div className="space-y-3">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.stat_name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white/80 text-sm">{stat.stat_name}</span>
                          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                            {stat.stat_value.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {selectedTab === 'users' && (
                  <div className="space-y-3">
                    {recentUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {user.photo_url ? (
                              <img
                                src={user.photo_url}
                                alt={user.display_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                {user.display_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {user.is_online && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-semibold truncate">{user.display_name}</p>
                              {user.founder_number && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-300">
                                  #{user.founder_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/60 truncate">@{user.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-white/50">{formatDate(user.created_at)}</span>
                              {user.latitude && user.longitude && (
                                <span className="text-xs text-cyan-400">📍 Located</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
