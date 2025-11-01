'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import BottomNav from '../../components/BottomNav'
import MobileLayout from '../../components/MobileLayout'

export default function GroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-[#0a0a0f] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-cyan-500/20">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <h1 className="text-white text-2xl font-bold">Groups</h1>
            <p className="text-white/60 text-sm">Connect with your community</p>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">👥</div>
            <h2 className="text-white text-3xl font-bold mb-4">Groups Coming Soon</h2>
            <p className="text-white/60 text-lg mb-8">
              Join group chats, events, and connect with your local community. This feature is launching soon!
            </p>
            
            {/* Feature Preview Cards */}
            <div className="space-y-4 text-left">
              <div className="glass-bubble p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💬</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Group Chats</h3>
                    <p className="text-white/60 text-sm">Chat with multiple people at once</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-bubble p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📍</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Local Events</h3>
                    <p className="text-white/60 text-sm">Discover and join nearby meetups</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-bubble p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🎉</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Interest Groups</h3>
                    <p className="text-white/60 text-sm">Find people with similar interests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </MobileLayout>
  )
}
