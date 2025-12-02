'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import MobileLayout from '@/components/MobileLayout'
import Link from 'next/link'
import { useHasFeature } from '@/hooks/usePrivileges'
import UpgradePrompt from '@/components/UpgradePrompt'

interface Channel {
  id: string
  name: string
  description?: string
  group_id: string
  type: 'video' // Video conferencing only (includes text & voice)
  member_count?: number
}

interface Group {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function ChannelsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [groups, setGroups] = useState<Group[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [creatingChannel, setCreatingChannel] = useState(false)

  // 🔒 Check if user can create channels (Plus only)
  const { allowed: canCreateChannels, loading: privilegeLoading } = useHasFeature('create_channels')

  useEffect(() => {
    const loadGroups = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Handle table doesn't exist error (42P17) gracefully
        if (error.code === '42P01' || error.code === '42P17') {
          console.warn('Groups table not found. Please create it in Supabase.')
          setGroups([])
        } else {
          console.error('Error loading groups:', error)
        }
      } else {
        setGroups(data || [])
        if (data && data.length > 0) {
          setSelectedGroup(data[0].id)
        }
      }
      setLoading(false)
    }

    loadGroups()
  }, [supabase])

  const loadChannels = useCallback(async () => {
    if (!selectedGroup) return

    try {
      // Try to load from channels table first
      const { data: channelsData, error } = await supabase
        .from('channels')
        .select('*')
        .eq('group_id', selectedGroup)
        .order('created_at', { ascending: true })

      if (!error && channelsData && channelsData.length > 0) {
        // Filter to only video channels (or treat all as video)
        setChannels(channelsData
          .filter(ch => ch.type === 'video' || !ch.type) // Only video or untyped
          .map(ch => ({
            id: ch.id,
            name: ch.name,
            description: ch.description,
            group_id: ch.group_id,
            type: 'video' as const,
            member_count: ch.member_count,
          })))
        return
      }

      // No default channels - users create their own video rooms
      setChannels([])
    } catch (err) {
      console.error('Error loading channels:', err)
      // Fallback to empty array
      setChannels([])
    }
  }, [selectedGroup, supabase])

  useEffect(() => {
    loadChannels()
  }, [loadChannels])

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) {
      alert('Please enter a channel name')
      return
    }

    // If no group selected, use first group or create a default one
    const groupId = selectedGroup || groups[0]?.id
    if (!groupId) {
      alert('Please create or select a group first')
      return
    }

    setCreatingChannel(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to create a channel')
        return
      }

      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || null,
          group_id: groupId,
          type: 'video', // Always video conferencing (includes text & voice)
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating channel:', error)
        if (error.code === '42P01') {
          alert('Channels table not set up. Please create it in Supabase.')
        } else {
          alert(`Failed to create channel: ${error.message}`)
        }
        return
      }

      // Success - reload channels
      await loadChannels()
      setShowCreateChannel(false)
      setNewChannelName('')
      setNewChannelDescription('')
    } catch (err: any) {
      console.error('Error creating channel:', err)
      alert(`Error: ${err.message || 'Failed to create channel'}`)
    } finally {
      setCreatingChannel(false)
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

  const currentGroup = groups.find(g => g.id === selectedGroup)

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-lime-400/20">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left - Title */}
              <div>
                <h1 className="text-white text-2xl font-bold">Channels & Rooms</h1>
                <p className="text-white/60 text-sm">Join group conversations</p>
              </div>

              {/* Right - Menu & Close */}
              <div className="flex items-center gap-2">
                {/* Hamburger Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                    title="Menu"
                  >
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 top-12 z-50 w-48 bg-black/95 border border-white/20 rounded-xl shadow-xl overflow-hidden">
                        <button
                          onClick={() => {
                            setShowMenu(false)
                            if (canCreateChannels) {
                              setShowCreateChannel(true)
                            } else {
                              setShowUpgradePrompt(true)
                            }
                          }}
                          className="w-full px-4 py-3 text-left text-white hover:bg-lime-400/20 transition flex items-center gap-3"
                        >
                          <span className="text-lime-400">+</span>
                          <span>Create Channel</span>
                          {!canCreateChannels && <span className="ml-auto">🔒</span>}
                        </button>
                        <div className="border-t border-white/10" />
                        <Link
                          href="/groups"
                          onClick={() => setShowMenu(false)}
                          className="w-full px-4 py-3 text-left text-white hover:bg-lime-400/20 transition flex items-center gap-3"
                        >
                          <svg className="w-4 h-4 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                          </svg>
                          <span>All Groups</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => router.push('/app')}
                  className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
                  title="Exit"
                >
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Group Selector */}
        {groups.length > 0 && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex gap-2 overflow-x-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition ${
                    selectedGroup === group.id
                      ? 'bg-lime-400/30 border border-lime-400/60 text-white'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Channels List */}
        <div className="px-4 py-4 space-y-2">
          {currentGroup && (
            <div className="mb-4">
              <h2 className="text-white/60 text-xs uppercase mb-2">{currentGroup.name}</h2>
              <p className="text-white/40 text-sm">{currentGroup.description || 'No description'}</p>
            </div>
          )}

          {channels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📹</div>
              <p className="text-white/60">No video rooms yet</p>
              <p className="text-white/40 text-sm mt-2">Create a video room to start conferencing</p>
            </div>
          ) : (
            channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/groups/channels/${channel.id}?group=${selectedGroup}&type=video`}
                className="block p-4 bg-black/40 border border-white/10 rounded-xl hover:border-purple-400/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20">
                      📹
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{channel.name}</h3>
                      {channel.description && (
                        <p className="text-white/60 text-xs">{channel.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-white/40 text-sm">
                    {channel.member_count || 0} online
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Create Video Room Modal */}
        {showCreateChannel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
            <div className="w-full max-w-md rounded-2xl bg-black/90 border border-white/20 p-6 relative">
              {!selectedGroup && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
                  <p className="text-yellow-200 text-sm">Please create or select a group first</p>
                  <button
                    onClick={() => setShowCreateChannel(false)}
                    className="mt-2 text-sm text-yellow-300 underline"
                  >
                    Close
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20">
                    📹
                  </div>
                  <h2 className="text-xl font-bold text-white">Create Video Room</h2>
                </div>
                <button
                  onClick={() => {
                    setShowCreateChannel(false)
                    setNewChannelName('')
                    setNewChannelDescription('')
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Info banner */}
              <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-purple-200 text-sm">
                  Video rooms include text chat and voice - all in one place.
                </p>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Room Name *
                  </label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="e.g., Hangout Room, Party Lounge"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="What's this room for?"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateChannel(false)
                      setNewChannelName('')
                      setNewChannelDescription('')
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingChannel || !newChannelName.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-lime-400 text-black font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingChannel ? 'Creating…' : 'Create Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🔒 Upgrade Prompt for Free Users */}
        {showUpgradePrompt && (
          <UpgradePrompt
            feature="Channels"
            onClose={() => setShowUpgradePrompt(false)}
          />
        )}
      </div>
      <BottomNav />
    </MobileLayout>
  )
}

