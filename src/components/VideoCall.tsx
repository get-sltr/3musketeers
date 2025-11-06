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
  onEndCall 
}: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const callFrameRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const callStartTimeRef = useRef<number>(0)

  // Initialize Daily.co call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        setIsConnecting(true)
        setError(null)

        // Create/get Daily.co room
        const response = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create Daily.co room')
        }

        const { url } = await response.json()

        if (!containerRef.current) {
          throw new Error('Container ref not available')
        }

        // Create Daily.co call frame
        const callFrame = DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: false, // We'll use custom controls
          showFullscreenButton: true,
          showParticipantsBar: false,
          showLocalVideo: true,
          iframeStyle: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '1rem',
          },
        })

        callFrameRef.current = callFrame

        // Set up event listeners
        callFrame
          .on('joined-meeting', () => {
            setIsCallActive(true)
            setIsConnecting(false)
            callStartTimeRef.current = Date.now()
          })
          .on('left-meeting', () => {
            endCall()
          })
          .on('participant-left', () => {
            endCall()
          })
          .on('error', (event: any) => {
            console.error('Daily.co error:', event)
            setError(event.error || 'Call error occurred')
            setIsConnecting(false)
          })
          .on('participant-joined', () => {
            setIsCallActive(true)
            setIsConnecting(false)
          })

        // Join the call
        await callFrame.join({ url })
        
      } catch (err) {
        console.error('Error initializing Daily.co call:', err)
        setError(err instanceof Error ? err.message : 'Failed to start call')
        setIsConnecting(false)
      }
    }

    initializeCall()

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave().then(() => {
          callFrameRef.current.destroy()
        })
      }
    }
  }, [conversationId])

  // Call duration timer
  useEffect(() => {
    if (!isCallActive) return

    const timer = setInterval(() => {
      if (callStartTimeRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isCallActive])

  const endCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave().then(() => {
        if (callFrameRef.current) {
          callFrameRef.current.destroy()
        }
      })
    }

    setIsCallActive(false)
    setIsConnecting(false)
    setCallDuration(0)
    callStartTimeRef.current = 0
    setError(null)

    onEndCall()
  }

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Daily.co Container */}
      <div ref={containerRef} className="relative w-full h-full max-w-6xl max-h-4xl" />

      {/* Custom Controls Overlay */}
      {isCallActive && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="glass-strong px-8 py-4 rounded-2xl flex items-center gap-4">
            {/* User Info */}
            <div className="glass-bubble px-4 py-2 mr-4">
              <h3 className="text-white font-semibold text-sm">{otherUserName}</h3>
              <p className="text-white/70 text-xs">{formatDuration(callDuration)}</p>
            </div>

            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all duration-300 ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all duration-300 ${
                isVideoOff 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              title={isVideoOff ? 'Turn on video' : 'Turn off video'}
            >
              {isVideoOff ? '📹' : '📷'}
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300"
              title="End call"
            >
              📞
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="glass-strong p-8 rounded-2xl text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-white text-xl font-semibold mb-2">Connecting...</h3>
            <p className="text-white/70">Starting video call with {otherUserName}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 glass-strong px-6 py-4 rounded-xl">
          <p className="text-red-400 font-semibold">⚠️ {error}</p>
          <button
            onClick={endCall}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}
