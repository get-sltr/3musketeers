'use client'

import { useState } from "react"

import { Room } from "livekit-client"

import { useCallChat } from "@/hooks/useCallChat"

export default function ChatSidebar({
  room,
  open,
  onClose,
}: {
  room: Room | null
  open: boolean
  onClose: () => void
}) {
  const { messages, sendMessage } = useCallChat(room)
  const [draft, setDraft] = useState("")

  if (!open) return null

  return (
    <div className="
      absolute top-0 right-0 h-full w-80
      bg-black/70 backdrop-blur-2xl border-l border-white/10
      z-[35] flex flex-col
    ">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold">Chat</h2>
        <button onClick={onClose} className="text-white/60 text-xs">Close</button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[90%] text-xs px-3 py-2 rounded-xl ${
              m.isLocal
                ? "ml-auto bg-purple-600/50"
                : "mr-auto bg-white/10"
            }`}
          >
            <div className="text-[10px] text-white/60 mb-0.5">
              {m.name}
            </div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      <form
        className="p-3 border-t border-white/10 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.trim()) return
          sendMessage(draft)
          setDraft("")
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/15 rounded-full px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
        <button
          type="submit"
          className="px-3 py-2 text-xs bg-purple-600/70 rounded-full"
        >
          Send
        </button>
      </form>
    </div>
  )
}

