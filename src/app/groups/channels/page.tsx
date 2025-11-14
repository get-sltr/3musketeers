'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const loadGroups = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading groups:', error)
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

  useEffect(() => {
    if (!selectedGroup) return

    const loadChannels = async () => {
      // For now, create default channels for each group
      // In production, you'd have a 'channels' table
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
    }

    loadChannels()
  }, [selectedGroup])

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
              <Link
                href="/groups"
                className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm"
              >
                All Groups
              </Link>
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
      </div>
      <BottomNav />
    </MobileLayout>
  )
}

