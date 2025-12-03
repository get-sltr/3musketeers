'use client'

import { useState, useRef, useEffect } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { useHasFeature } from '@/hooks/usePrivileges'
import { csrfFetch } from '@/lib/csrf-client'
import UpgradePrompt from './UpgradePrompt'

interface VideoCallProps {
  conversationId: string
  currentUserId: string  // ✅ Added for efficiency
  otherUserId: string
  otherUserName: string
  onEndCall: () => void
}

export default function VideoCall({
  conversationId,
  currentUserId,  // ✅ Now using passed prop
  otherUserId,
  otherUserName,
  onEndCall,
}: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const callFrameRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 🔒 Check if user has video call access
  const { allowed: hasVideoAccess, loading: checkingAccess } = useHasFeature('video_calls')

  useEffect(() => {
    // If not allowed and not loading, show upgrade prompt
    if (!checkingAccess && !hasVideoAccess) {
      setShowUpgrade(true)
      return
    }

    // Don't initialize if still checking or not allowed
    if (checkingAccess || !hasVideoAccess) return

    const initializeCall = async () => {
      setError(null)

      try {
        const response = await csrfFetch('/api/daily/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            currentUserId  // ✅ Pass it to the API
          }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Failed to create Daily room (${response.status}): ${text}`)
        }

        const { url, token } = await response.json()

        if (!url) {
          throw new Error('Daily room URL missing from response')
        }

        const containerElement = containerRef.current
        if (!containerElement) {
          throw new Error('Video container unavailable')
        }

        const callFrame = DailyIframe.createFrame(containerElement as HTMLElement, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: {
            position: 'absolute',
            width: '100%',
            height: '100%',
          },
        })

        callFrameRef.current = callFrame

        // Use token if available, otherwise use URL directly
        await callFrame.join({ url, token: token || undefined })
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
  }, [conversationId, currentUserId, onEndCall, hasVideoAccess, checkingAccess])

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

  // 🔒 Show upgrade prompt for free users
  if (showUpgrade) {
    return <UpgradePrompt feature="Video Calls" onClose={onEndCall} />
  }

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Checking access...</div>
      </div>
    )
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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4" role="toolbar" aria-label="Video call controls">
          <button
            onClick={toggleMute}
            className="glass-bubble px-6 py-3"
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-pressed={isMuted}
          >
            <span aria-hidden="true">{isMuted ? '🔇' : '🎤'}</span>
          </button>
          <button
            onClick={toggleVideo}
            className="glass-bubble px-6 py-3"
            aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            aria-pressed={isVideoOff}
          >
            <span aria-hidden="true">{isVideoOff ? '📹' : '📷'}</span>
          </button>
          <button
            onClick={leaveCall}
            className="glass-bubble px-6 py-3 bg-red-500"
            aria-label="End call"
          >
            End Call
          </button>
        </div>
      )}
    </div>
  )
}
