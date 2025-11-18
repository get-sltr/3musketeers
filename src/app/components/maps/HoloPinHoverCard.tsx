'use client'

import React from 'react'

type Handlers = {
  onChat: (userId: string) => void
  onVideo: (userId: string) => void
  onTap: (userId: string) => void
  onNav: (location: { lat: number; lng: number }) => void
}

export function HoloPinHoverCard({
  user,
  visible,
  handlers,
}: {
  user: any
  visible: boolean
  handlers: Handlers
}) {
  if (!visible) return null
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-3 w-72">
      <div className="flex gap-3 items-center">
        <img src={user.photo} alt={user.name} className="w-12 h-12 rounded-xl object-cover" />
        <div className="flex-1">
          <div className="font-semibold text-white">
            {user.name} {user.founder ? '👑' : ''}
          </div>
          <div className="text-xs text-white/70">
            {user.age} years • {user.distance}
          </div>
          <div className="text-xs text-white/60">
            {user.status}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <button onClick={() => handlers.onChat(user.id)} className="px-2 py-1 text-xs rounded-md bg-lime-400/20 text-lime-200 border border-lime-400/40">Chat</button>
        <button onClick={() => handlers.onVideo(user.id)} className="px-2 py-1 text-xs rounded-md bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40">Video</button>
        <button onClick={() => handlers.onTap(user.id)} className="px-2 py-1 text-xs rounded-md bg-amber-500/20 text-amber-200 border border-amber-400/40">Tap</button>
        <a onClick={() => handlers.onNav({ lat: user.latitude, lng: user.longitude })} className="px-2 py-1 text-xs rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-center cursor-pointer">Nav</a>
      </div>
      {user.dtfn && (
        <div className="mt-2 text-[10px] uppercase tracking-widest text-red-300">DTFN</div>
      )}
      {user.badge === 'NOW' && (
        <div className="mt-1 text-[10px] uppercase tracking-widest text-lime-300">NOW</div>
      )}
    </div>
  )
}