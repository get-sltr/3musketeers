"use client"

import { useEffect, useState, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import MobileLayout from '@/components/MobileLayout'

interface GroupMessage {
  id: string
  group_id: string
  sender_id: string
  content: string
  created_at: string
  sender_profile?: {
    display_name: string
    photo_url: string
  }
}

interface Channel {
  id: string
  name: string
  description?: string
  type: 'text' | 'voice' | 'video'
}

function GroupDetailContent({ groupId }: { groupId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const channelId = searchParams?.get('channel')

  const [group, setGroup] = useState<any>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Load group and user
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUserId(user.id)

      // Load group
      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      setGroup(groupData)

      // Load channels for this group
      const { data: channelsData } = await supabase
        .from('channels')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })

      if (channelsData) {
        setChannels(channelsData)
        // Set active channel if specified in URL or default to first text channel
        if (channelId) {
          const channel = channelsData.find((c: Channel) => c.id === channelId)
          setActiveChannel(channel || null)
        } else {
          const textChannel = channelsData.find((c: Channel) => c.type === 'text')
          setActiveChannel(textChannel || null)
        }
      }

      setLoading(false)
    }
    init()
  }, [groupId, channelId, router, supabase])

  // Load messages for active channel
  useEffect(() => {
    if (!activeChannel || activeChannel.type !== 'text') return

    const loadMessages = async () => {
      const { data } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender_profile:profiles!group_messages_sender_id_fkey(display_name, photo_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setMessages(data)
        setTimeout(scrollToBottom, 100)
      }
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Load sender profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg: GroupMessage = {
            ...payload.new as GroupMessage,
            sender_profile: profile || undefined,
          }
          setMessages((prev) => [...prev, newMsg])
          setTimeout(scrollToBottom, 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeChannel, groupId, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: currentUserId,
          content: newMessage.trim(),
        })

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message')
      } else {
        setNewMessage('')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleChannelClick = (channel: Channel) => {
    if (channel.type === 'text') {
      setActiveChannel(channel)
      router.push(`/groups/${groupId}?channel=${channel.id}`)
    } else {
      // Navigate to video/voice room
      router.push(`/groups/channels/${channel.id}?group=${groupId}&type=${channel.type}`)
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

  if (!group) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 mb-4">Group not found</p>
            <Link href="/groups" className="text-lime-400 hover:underline">
              Back to Groups
            </Link>
          </div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-lime-400/20">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/groups')}
                  className="text-white/70 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-white text-lg font-bold">{group.name}</h1>
                  {activeChannel && (
                    <p className="text-white/60 text-sm">#{activeChannel.name}</p>
                  )}
                </div>
              </div>
              <Link
                href={`/groups/channels?group=${groupId}`}
                className="px-3 py-1.5 rounded-lg bg-lime-400/20 text-lime-300 text-sm hover:bg-lime-400/30 transition"
              >
                Channels
              </Link>
            </div>
          </div>
        </div>

        {/* Channel Tabs */}
        {channels.length > 0 && (
          <div className="border-b border-white/10 bg-black/40">
            <div className="px-4 py-2 flex gap-2 overflow-x-auto">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                    activeChannel?.id === channel.id
                      ? 'bg-lime-400/30 text-white border border-lime-400/60'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {channel.type === 'text' && <span>💬</span>}
                  {channel.type === 'voice' && <span>🎤</span>}
                  {channel.type === 'video' && <span>📹</span>}
                  <span>{channel.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Area */}
        {activeChannel?.type === 'text' ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-white/60">No messages yet</p>
                  <p className="text-white/40 text-sm mt-1">Be the first to say something!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId
                    const displayName = msg.sender_profile?.display_name || 'U'
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          {!isOwn && (
                            <div className="flex items-center gap-2 mb-1">
                              {msg.sender_profile?.photo_url ? (
                                <img
                                  src={msg.sender_profile.photo_url}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-lime-400/30 flex items-center justify-center text-xs text-lime-300">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-white/60 text-xs">
                                {msg.sender_profile?.display_name || 'Anonymous'}
                              </span>
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-lime-400 text-black rounded-tr-sm'
                                : 'bg-white/10 text-white rounded-tl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <p className={`text-white/40 text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="fixed bottom-16 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lime-400"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 rounded-full bg-lime-400 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No active text channel */
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <div className="text-6xl mb-4">📹</div>
              <h2 className="text-white text-xl font-bold mb-2">
                {group.name}
              </h2>
              <p className="text-white/60 mb-6">
                {group.description || 'Join a channel to start chatting or connect via video/voice'}
              </p>
              {channels.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-white/40 text-sm mb-3">Available Channels:</p>
                  {channels.slice(0, 3).map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelClick(channel)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center gap-2"
                    >
                      {channel.type === 'text' && <span>💬</span>}
                      {channel.type === 'voice' && <span>🎤</span>}
                      {channel.type === 'video' && <span>📹</span>}
                      {channel.name}
                    </button>
                  ))}
                </div>
              ) : (
                <Link
                  href="/groups/channels"
                  className="inline-block px-6 py-3 rounded-xl bg-lime-400 text-black font-semibold hover:scale-105 transition-all"
                >
                  Browse Channels
                </Link>
              )}
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </MobileLayout>
  )
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <MobileLayout>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400"></div>
        </div>
      </MobileLayout>
    }>
      <GroupDetailContent groupId={params.id} />
    </Suspense>
  )
}
