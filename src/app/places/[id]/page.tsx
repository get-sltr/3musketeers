"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PlaceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const [place, setPlace] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.from('places').select('*').eq('id', params.id).single()
      setPlace(data)
      setLoading(false)
    }
    run()
  }, [params.id, supabase])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white/60">Loading…</div>
  if (!place) return <div className="min-h-screen flex items-center justify-center text-white/60">Not found</div>

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4">
      <button onClick={() => router.back()} className="text-white/70 hover:text-white mb-4">← Back</button>
      <div className="max-w-xl mx-auto bg-black/70 border border-white/10 rounded-2xl p-4 text-white space-y-2">
        <h1 className="text-2xl font-bold">{place.name}</h1>
        <div className="text-white/70">{place.type}</div>
        {place.notes && <p className="text-white/80 mt-2">{place.notes}</p>}
        {(place.latitude && place.longitude) && (
          <div className="text-xs text-white/50 mt-2">{place.latitude}, {place.longitude}</div>
        )}
      </div>
    </div>
  )
}
