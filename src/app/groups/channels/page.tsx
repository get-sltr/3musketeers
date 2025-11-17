'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import MobileLayout from '@/components/MobileLayout'
import Link from 'next/link'

interface Channel {
  id: string
  name: string
  description?: string
  group_id: string
  type: 'text' | 'voice' | 'video'
  member_count?: number
}

interface Group {
  id: string
  title: string
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
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'video'>('text')
  const [creatingChannel, setCreatingChannel] = useState(false)

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
        setChannels(channelsData.map(ch => ({
          id: ch.id,
          name: ch.name,
          description: ch.description,
          group_id: ch.group_id,
          type: ch.type as 'text' | 'voice' | 'video',
          member_count: ch.member_count,
        })))
        return
      }

      // Fallback to default channels if table doesn't exist or is empty
      const defaultChannels: Channel[] = [
        {
          id: `${selectedGroup}-general`,
          name: 'General',
          description: 'General discussion',
          group_id: selectedGroup,
          type: 'text',
        },
        {
          id: `${selectedGroup}-voice`,
          name: 'Voice Chat',
          description: 'Join voice call',
          group_id: selectedGroup,
          type: 'voice',
        },
        {
          id: `${selectedGroup}-video`,
          name: 'Video Room',
          description: 'Join video call',
          group_id: selectedGroup,
          type: 'video',
        },
      ]
      setChannels(defaultChannels)
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
    if (!newChannelName.trim() || !selectedGroup) return

    setCreatingChannel(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('channels')
        .insert({
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || null,
          group_id: selectedGroup,
          type: newChannelType,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating channel:', error)
        alert('Failed to create channel. Please try again.')
        return
      }

      // Reload channels
      await loadChannels()
      setShowCreateChannel(false)
      setNewChannelName('')
      setNewChannelDescription('')
      setNewChannelType('text')
    } catch (err) {
      console.error('Error creating channel:', err)
      alert('Failed to create channel. Please try again.')
    } finally {
      setCreatingChannel(false)
    }
  }

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </MobileLayout>
    )
  }

  const currentGroup = groups.find(g => g.id === selectedGroup)

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-cyan-500/20">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-2xl font-bold">Channels & Rooms</h1>
                <p className="text-white/60 text-sm">Join group conversations</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-semibold hover:scale-105 transition-all"
                >
                  + Create Channel
                </button>
                <Link
                  href="/groups"
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm"
                >
                  All Groups
                </Link>
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
                      ? 'bg-cyan-500/30 border border-cyan-400/60 text-white'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {group.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Channels List */}
        <div className="px-4 py-4 space-y-2">
          {currentGroup && (
            <div className="mb-4">
              <h2 className="text-white/60 text-xs uppercase mb-2">{currentGroup.title}</h2>
              <p className="text-white/40 text-sm">{currentGroup.description || 'No description'}</p>
            </div>
          )}

          {channels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No channels available</p>
              <p className="text-white/40 text-sm mt-2">Create a group to get started</p>
            </div>
          ) : (
            channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/groups/channels/${channel.id}?group=${selectedGroup}&type=${channel.type}`}
                className="block p-4 bg-black/40 border border-white/10 rounded-xl hover:border-cyan-400/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      channel.type === 'text' ? 'bg-blue-500/20' :
                      channel.type === 'voice' ? 'bg-green-500/20' :
                      'bg-purple-500/20'
                    }`}>
                      {channel.type === 'text' && '💬'}
                      {channel.type === 'voice' && '🎤'}
                      {channel.type === 'video' && '📹'}
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

        {/* Create Channel Modal */}
        {showCreateChannel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4">
            <div className="w-full max-w-md rounded-2xl bg-black/90 border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Create Channel</h2>
                <button
                  onClick={() => {
                    setShowCreateChannel(false)
                    setNewChannelName('')
                    setNewChannelDescription('')
                    setNewChannelType('text')
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Channel Name *
                  </label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="e.g., General, Voice Chat, Video Room"
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
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="What's this channel for?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Channel Type *
                  </label>
                  <div className="flex gap-2">
                    {(['text', 'voice', 'video'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewChannelType(type)}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                          newChannelType === type
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {type === 'text' && '💬 Text'}
                        {type === 'voice' && '🎤 Voice'}
                        {type === 'video' && '📹 Video'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateChannel(false)
                      setNewChannelName('')
                      setNewChannelDescription('')
                      setNewChannelType('text')
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingChannel || !newChannelName.trim()}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingChannel ? 'Creating…' : 'Create Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </MobileLayout>
  )
}

