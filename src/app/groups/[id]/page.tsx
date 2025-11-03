"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.from('groups').select('*').eq('id', params.id).single()
      setGroup(data)
      setLoading(false)
    }
    run()
  }, [params.id, supabase])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/60">Loading…</div>
  if (!group) return <div className="min-h-screen flex items-center justify-center text-white/60">Not found</div>

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4">
      <button onClick={() => router.back()} className="text-white/70 hover:text-white mb-4">← Back</button>
      <div className="max-w-xl mx-auto bg-black/70 border border-white/10 rounded-2xl p-4 text-white space-y-2">
        <h1 className="text-2xl font-bold">{group.title}</h1>
        {group.time && <div className="text-white/70">{new Date(group.time).toLocaleString()}</div>}
        {group.description && <p className="text-white/80 mt-2 whitespace-pre-wrap">{group.description}</p>}
      </div>
    </div>
  )
}
