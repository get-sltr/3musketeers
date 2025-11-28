'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import BottomNav from '../../components/BottomNav'
import MobileLayout from '../../components/MobileLayout'
import { useHasFeature } from '@/hooks/usePrivileges'
import UpgradePrompt from '@/components/UpgradePrompt'

interface Group {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function GroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [creating, setCreating] = useState(false)
  
  // 🔒 Check if user can create/join groups (Plus only)
  const { allowed: canCreateGroups, loading: privilegeLoading } = useHasFeature('create_groups')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      // Auto-setup THE CLUB if it doesn't exist
      await setupTheClub()
      await loadGroups()
      setLoading(false)
    }
    init()
  }, [router])

  const setupTheClub = async () => {
    try {
      const response = await fetch('/api/groups/setup-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ The Club sltr setup:', data.message)
      }
    } catch (error) {
      console.error('Error setting up The Club sltr:', error)
    }
  }

  const loadGroups = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setGroups(data)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return

    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          host_id: user.id,
        })

      if (error) {
        console.error('Error creating group:', error)
        alert(`Failed to create group: ${error.message}`)
        return
      }

      await loadGroups()
      setShowCreateModal(false)
      setGroupName('')
      setGroupDescription('')
    } catch (err: any) {
      console.error('Error:', err)
      alert(`Error: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400"></div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-lime-400/20">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-2xl font-bold">Groups</h1>
                <p className="text-white/60 text-sm">Connect with your community</p>
              </div>
              <button
                onClick={() => {
                  if (canCreateGroups) {
                    setShowCreateModal(true)
                  } else {
                    setShowUpgradePrompt(true)
                  }
                }}
                className="px-4 py-2 rounded-xl bg-lime-400 text-black text-sm font-semibold hover:scale-105 transition-all flex items-center gap-2"
              >
                {!canCreateGroups && <span>🔒</span>}
                + Create Group
              </button>
            </div>
          </div>
        </div>

        {/* Channels & Rooms Link */}
        <div className="px-4 py-4">
          <Link
            href="/groups/channels"
            className="block p-6 bg-lime-400/20 border border-lime-400/40 rounded-2xl hover:border-lime-400/60 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-bold mb-1">Channels & Rooms</h2>
                <p className="text-white/70 text-sm">Join group video calls and voice chats</p>
              </div>
              <div className="text-2xl">📹</div>
            </div>
          </Link>
        </div>

        {/* Groups List */}
        {groups.length > 0 && (
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-white/60 text-xs uppercase mb-2">Your Groups</h2>
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="block p-4 bg-black/40 border border-white/10 rounded-xl hover:border-lime-400/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{group.name}</h3>
                    {group.description && (
                      <p className="text-white/60 text-sm mt-1 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                  <div className="text-lime-400/60">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State - Only show if no groups */}
        {groups.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">👥</div>
              <h2 className="text-white text-3xl font-bold mb-4">Create Your First Group</h2>
              <p className="text-white/60 text-lg mb-8">
                Start a group to connect with your community through video calls, voice chats, and messaging.
              </p>
              <button
                onClick={() => {
                  if (canCreateGroups) {
                    setShowCreateModal(true)
                  } else {
                    setShowUpgradePrompt(true)
                  }
                }}
                className="px-6 py-3 rounded-xl bg-lime-400 text-black font-semibold hover:scale-105 transition-all flex items-center gap-2"
              >
                {!canCreateGroups && <span>🔒</span>}
                + Create Your First Group
              </button>
              {!canCreateGroups && (
                <p className="text-white/50 text-sm mt-4">
                  Groups are a SLTR Pro feature
                </p>
              )}
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
            <div className="w-full max-w-md rounded-2xl bg-black/90 border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Create Group</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setGroupName('')
                    setGroupDescription('')
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    placeholder="e.g., Founders Circle, Tech Group"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    placeholder="What's this group about?"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setGroupName('')
                      setGroupDescription('')
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !groupName.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-lime-400 text-black font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating…' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🔒 Upgrade Prompt for Free Users */}
        {showUpgradePrompt && (
          <UpgradePrompt
            feature="Groups"
            onClose={() => setShowUpgradePrompt(false)}
          />
        )}

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </MobileLayout>
  )
}
