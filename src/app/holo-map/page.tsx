'use client'

import MapboxUsers from '@/app/components/maps/MapboxUsers'
import { useRouter } from 'next/navigation'

export default function HoloMapPage() {
  const router = useRouter()

  const onChat = (userId: string) => {
    router.push(`/messages?conversation=${encodeURIComponent(userId)}`)
  }
  const onVideo = (userId: string) => {
    // Navigate to messages; your messaging UI can start a call from there
    router.push(`/messages?conversation=${encodeURIComponent(userId)}&call=1`)
  }
  const onTap = (userId: string) => {
    // TODO: implement real quick tap; for now, route to messages thread
    router.push(`/messages?conversation=${encodeURIComponent(userId)}&tap=1`)
  }
  const onNav = (loc: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
    if (typeof window !== 'undefined') window.open(url, '_blank')
  }

  return (
    <div className="w-full h-screen">
      <MapboxUsers advancedPins autoLoad onChat={onChat} onVideo={onVideo} onTap={onTap} onNav={onNav} />
    </div>
  )
}
