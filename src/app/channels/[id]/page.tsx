'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import MobileLayout from '@/components/MobileLayout'
import BottomNav from '@/components/BottomNav'

// Define our types
type Channel = {
  id: string
  title: string
  description: string
  host_id: string
  image_url: string
  member_count: number
}

type Post = {
  id: string
  content: string
  created_at: string
  sender_id: string
  profiles: { // Author's profile
    display_name: string
    photo_url: string
  }
}

type Member = {
  user_id: string
  role: string
}

export default function ChannelDetailPage() {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [membership, setMembership] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const params = useParams()
  const channelId = params?.id as string
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  const isHostOrAdmin = membership?.role === 'admin' || channel?.host_id === currentUserId

  useEffect(() => {
    async function fetchChannelDetails() {
      if (!channelId) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch channel info
      const { data: channelData } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single()
      if (channelData) setChannel(channelData)

      // Fetch channel messages and author profiles
      const { data: postData } = await supabase
        .from('channel_messages')
        .select(`
          id, content, created_at, sender_id,
          profiles ( display_name, photo_url )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true }) // Show oldest first
      if (postData) setPosts(postData as any)

      // Check if user is a member
      if (user) {
        const { data: memberData } = await supabase
          .from('channel_members')
          .select('user_id, role')
          .eq('channel_id', channelId)
          .eq('user_id', user.id)
          .maybeSingle()
        if (memberData) setMembership(memberData)
      }
      
      setLoading(false)
    }
    fetchChannelDetails()
  }, [channelId])
  
  // Realtime for new posts
  useEffect(() => {
    if (!channelId) return
    const supabase = createClient()
    
    const channel = supabase
      .channel(`public:channel_messages:channel_id=eq.${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          // We get the new message, but we need the author's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', payload.new.sender_id)
            .single()
            
          const newPost = { ...payload.new, profiles: profile } as Post
          setPosts((prevPosts) => [...prevPosts, newPost])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  // Auto-scroll
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [posts])

  const handleJoinChannel = async () => {
    if (!currentUserId || !channelId) return
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channelId,
        user_id: currentUserId,
        role: 'member'
      })
      .select()
      .single()

    if (!error && data) {
      alert('Joined channel!')
      setMembership(data)
      // Update member count
      if (channel) {
        setChannel({ ...channel, member_count: channel.member_count + 1 })
      }
    } else {
      alert('Error joining channel: ' + (error?.message || 'Unknown error'))
    }
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !isHostOrAdmin || !currentUserId) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('channel_messages')
      .insert({
        channel_id: channelId,
        sender_id: currentUserId,
        content: newPostContent
      })
      
    if (error) {
      alert('Error creating post: ' + error.message)
    } else {
      setNewPostContent('') // Clear input
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
  
  if (!channel) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
          <p>Channel not found.</p>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="h-screen flex flex-col bg-[#0a0a0f] text-white pb-20">
        {/* Channel Header */}
        <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-cyan-500/20 p-4 flex items-center gap-3">
          <Link href="/channels" className="bg-black/50 p-2 rounded-full hover:bg-black/70 transition">
            &larr;
          </Link>
          <img 
            src={channel.image_url || 'https://placehold.co/100x100/3a003a/ffffff?text=SLTR'}
            alt={channel.title}
            className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{channel.title}</h1>
            <p className="text-sm text-gray-400">{channel.member_count} members</p>
          </div>
        </header>

        {/* Posts Area (like a chat) */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <p className="text-lg mb-2">No posts yet</p>
              <p className="text-sm">Be the first to post in this channel!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="flex items-start gap-3">
                <img 
                  src={post.profiles?.photo_url || 'https://placehold.co/100x100/1a1a1a/ffffff?text=SLTR'}
                  alt={post.profiles?.display_name || 'User'}
                  className="w-10 h-10 rounded-full object-cover border border-cyan-500/20"
                />
                <div className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-white/10 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-cyan-400">{post.profiles?.display_name || 'Anonymous'}</span>
                    <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-white mt-1 whitespace-pre-wrap break-words">{post.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={endOfMessagesRef} />
        </main>
        
        {/* Footer: Join Button or Admin Post Input */}
        <footer className="sticky bottom-0 bg-black/90 backdrop-blur-xl border-t border-cyan-500/20 p-4">
          {!membership ? (
            <button
              onClick={handleJoinChannel}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-xl hover:from-purple-400 hover:to-pink-400 transition"
            >
              Join Channel
            </button>
          ) : isHostOrAdmin ? (
            <div className="flex gap-2">
              <input 
                type="text"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleCreatePost()
                  }
                }}
                placeholder="Send a broadcast..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
              <button 
                onClick={handleCreatePost} 
                disabled={!newPostContent.trim()}
                className="px-4 py-2 bg-purple-600 rounded-lg font-semibold hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm">You are a member. Only admins can post.</p>
          )}
        </footer>

        <BottomNav />
      </div>
    </MobileLayout>
  )
}


