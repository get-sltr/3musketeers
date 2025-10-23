'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
  const [error, setError] = useState<string | null>(null)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    initializeCall()
    return () => {
      endCall()
    }
  }, [])

  const initializeCall = async () => {
    try {
      setCallStatus('connecting')
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })
      
      peerConnectionRef.current = peerConnection
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to other user via Supabase realtime
          sendSignal('ice-candidate', event.candidate)
        }
      }
      
      // Listen for signals from other user
      const channel = supabase.channel(`call-${conversationId}`)
      
      channel.on('broadcast', { event: 'signal' }, (payload) => {
        handleSignal(payload.signal)
      })
      
      await channel.subscribe()
      
      // Create and send offer
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      sendSignal('offer', offer)
      
      setIsCallActive(true)
      setCallStatus('connected')
      
    } catch (err) {
      console.error('Error initializing call:', err)
      setError('Failed to start video call. Please check your camera and microphone permissions.')
      setCallStatus('ended')
    }
  }

  const handleSignal = async (signal: any) => {
    if (!peerConnectionRef.current) return
    
    try {
      if (signal.type === 'offer') {
        await peerConnectionRef.current.setRemoteDescription(signal)
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        sendSignal('answer', answer)
      } else if (signal.type === 'answer') {
        await peerConnectionRef.current.setRemoteDescription(signal)
      } else if (signal.type === 'ice-candidate') {
        await peerConnectionRef.current.addIceCandidate(signal)
      }
    } catch (err) {
      console.error('Error handling signal:', err)
    }
  }

  const sendSignal = async (type: string, data: any) => {
    try {
      const channel = supabase.channel(`call-${conversationId}`)
      await channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { signal: { type, ...data } }
      })
    } catch (err) {
      console.error('Error sending signal:', err)
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    
    setIsCallActive(false)
    setCallStatus('ended')
    onEndCall()
  }

  if (callStatus === 'ended') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📞</div>
          <h2 className="text-2xl font-bold text-white mb-2">Call Ended</h2>
          <p className="text-white/60 mb-6">The video call has ended</p>
          <button
            onClick={onEndCall}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
          >
            Back to Messages
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Call Failed</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={onEndCall}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
          >
            Back to Messages
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Remote Video (Main View) */}
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {callStatus === 'connecting' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white text-lg">Connecting to {otherUserName}...</p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-xl overflow-hidden border-2 border-white/20">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Call Info */}
      <div className="absolute top-4 left-4 glass-bubble px-4 py-2">
        <h3 className="text-white font-semibold">{otherUserName}</h3>
        <p className="text-white/60 text-sm">
          {callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
        </p>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="glass-bubble p-4 flex items-center gap-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isVideoOn 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoOn ? '📹' : '📷'}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-300"
          >
            📞
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {isMuted && (
          <div className="glass-bubble px-3 py-1">
            <span className="text-white text-sm">🔇 Muted</span>
          </div>
        )}
        {!isVideoOn && (
          <div className="glass-bubble px-3 py-1">
            <span className="text-white text-sm">📷 Video Off</span>
          </div>
        )}
      </div>
    </div>
  )
}
