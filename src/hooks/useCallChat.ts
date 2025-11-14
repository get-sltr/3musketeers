'use client'

import { useEffect, useState } from "react"

import { Room, RoomEvent } from "livekit-client"

interface ChatMessage {
  id: string
  userId: string
  name: string
  text: string
  createdAt: string
  isLocal: boolean
}

export const useCallChat = (room: Room | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    if (!room) return

    const handleData = (payload: Uint8Array, participant: any) => {
      try {
        const decoded = new TextDecoder().decode(payload)
        const data = JSON.parse(decoded)
        if (data.type !== "chat") return

        const msg: ChatMessage = {
          id: `${Date.now()}_${Math.random()}`,
          userId: data.userId ?? participant.identity,
          name: data.name ?? "Unknown",
          text: data.text,
          createdAt: new Date().toISOString(),
          isLocal: false,
        }

        setMessages((prev) => [...prev, msg])
      } catch (e) {
        console.error("Error parsing chat data", e)
      }
    }

    room.on(RoomEvent.DataReceived, handleData)

    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room])

  const sendMessage = async (text: string) => {
    if (!room || !text.trim()) return

    let meta: any = {}
    try {
      meta = JSON.parse(room.localParticipant.metadata || "{}")
    } catch {
      meta = {}
    }

    const payload = {
      type: "chat",
      text: text.trim(),
      userId: meta.userId ?? room.localParticipant.identity,
      name: meta.name ?? "Me",
    }

    const encoded = new TextEncoder().encode(JSON.stringify(payload))

    await room.localParticipant.publishData(
      encoded,
      { reliable: true }
    )

    const localMsg: ChatMessage = {
      id: `${Date.now()}_${Math.random()}`,
      userId: payload.userId,
      name: payload.name,
      text: payload.text,
      createdAt: new Date().toISOString(),
      isLocal: true,
    }

    setMessages((prev) => [...prev, localMsg])
  }

  return {
    messages,
    sendMessage,
  }
}

