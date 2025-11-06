'use client'

import { useState, useRef, useEffect } from 'react'
import DailyIframe from '@daily-co/daily-js'

interface VideoCallProps {
  conversationId: string
  otherUserId: string
  otherUserName: string
  onEndCall: () => void
}

export default function VideoCall({
  conversationId,
  otherUserId,
  otherUserName,
  onEndCall,
}: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callFrameRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initializeCall = async () => {
      setError(null)

      try {
        if (!process.env.NEXT_PUBLIC_HAS_DAILY) {
          throw new Error('Daily API key is not configured. Set DAILY_API_KEY in your environment.')
        }

        const response = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Failed to create Daily room (${response.status}): ${text}`)
        }

        const { url } = await response.json()

        if (!url) {
          throw new Error('Daily room URL missing from response')
        }

        const callFrame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            position: 'absolute',
            width: '100%',
            height: '100%',
          },
        })

        callFrameRef.current = callFrame

        await callFrame.join({ url })
        setIsCallActive(true)

        callFrame.on('left-meeting', () => {
          onEndCall()
        })

        callFrame.on('participant-left', () => {
          onEndCall()
        })
      } catch (err: any) {
        console.error('Daily video call error:', err)
        setError(err.message || 'Unable to start video call. Please try again later.')
        callFrameRef.current?.destroy()
        callFrameRef.current = null
      }
    }

    initializeCall()

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }
    }
  }, [conversationId, onEndCall])

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOff)
      setIsVideoOff(!isVideoOff)
    }
  }

  const leaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave()
      callFrameRef.current.destroy()
      callFrameRef.current = null
    }
    onEndCall()
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div ref={containerRef} className="w-full h-full" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-500/20 border border-red-500/40 rounded-2xl p-6 text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Video call unavailable</h2>
            <p className="text-red-200 text-sm mb-4">{error}</p>
            <button
              onClick={leaveCall}
              className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {!error && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button onClick={toggleMute} className="glass-bubble px-6 py-3">
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button onClick={toggleVideo} className="glass-bubble px-6 py-3">
            {isVideoOff ? '📹' : '📷'}
          </button>
          <button onClick={leaveCall} className="glass-bubble px-6 py-3 bg-red-500">
            End Call
          </button>
        </div>
      )}
    </div>
  )
}
