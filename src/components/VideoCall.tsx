'use client'

import { useState, useRef, useEffect } from 'react'
import { useSocket } from '@/hooks/useSocket'

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
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callStartTimeRef = useRef<number>(0)
  
  const { 
    socket, 
    isConnected, 
    startVideoCall, 
    answerVideoCall, 
    sendIceCandidate, 
    endVideoCall 
  } = useSocket()

  // Initialize WebRTC
  useEffect(() => {
    if (!socket || !isConnected) return

    // WebRTC configuration
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    peerConnectionRef.current = new RTCPeerConnection(configuration)

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(otherUserId, event.candidate)
      }
    }

    // Handle remote stream
    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      if (peerConnectionRef.current?.connectionState === 'connected') {
        setIsCallActive(true)
        setIsConnecting(false)
        callStartTimeRef.current = Date.now()
      }
    }

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
    }
  }, [socket, isConnected, otherUserId, sendIceCandidate])

  // Handle incoming call offers
  useEffect(() => {
    if (!socket) return

    const handleCallOffer = async (data: any) => {
      if (data.fromUserId === otherUserId) {
        setIsConnecting(true)
        
        try {
          // Get user media
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          })
          
          localStreamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }

          // Add tracks to peer connection
          stream.getTracks().forEach(track => {
            peerConnectionRef.current?.addTrack(track, stream)
          })

          // Create answer
          await peerConnectionRef.current?.setRemoteDescription(data.offer)
          const answer = await peerConnectionRef.current?.createAnswer()
          await peerConnectionRef.current?.setLocalDescription(answer)
          
          // Send answer
          answerVideoCall(otherUserId, answer!)
          
        } catch (error) {
          console.error('Error handling call offer:', error)
          setIsConnecting(false)
        }
      }
    }

    const handleCallAnswer = async (data: any) => {
      if (data.fromUserId === otherUserId) {
        await peerConnectionRef.current?.setRemoteDescription(data.answer)
      }
    }

    const handleIceCandidate = async (data: any) => {
      if (data.fromUserId === otherUserId) {
        await peerConnectionRef.current?.addIceCandidate(data.candidate)
      }
    }

    const handleCallEnd = (data: any) => {
      if (data.fromUserId === otherUserId) {
        endCall()
      }
    }

    // Add event listeners
    window.addEventListener('call_offer', handleCallOffer)
    window.addEventListener('call_answer', handleCallAnswer)
    window.addEventListener('call_ice_candidate', handleIceCandidate)
    window.addEventListener('call_end', handleCallEnd)

    return () => {
      window.removeEventListener('call_offer', handleCallOffer)
      window.removeEventListener('call_answer', handleCallAnswer)
      window.removeEventListener('call_ice_candidate', handleIceCandidate)
      window.removeEventListener('call_end', handleCallEnd)
    }
  }, [socket, otherUserId, answerVideoCall])

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

  const startCall = async () => {
    try {
      setIsConnecting(true)
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current?.addTrack(track, stream)
      })

      // Create offer
      const offer = await peerConnectionRef.current?.createOffer()
      await peerConnectionRef.current?.setLocalDescription(offer)
      
      // Send offer
      startVideoCall(otherUserId, conversationId, offer!)
      
    } catch (error) {
      console.error('Error starting call:', error)
      setIsConnecting(false)
    }
  }

  const endCall = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    // Notify other user
    endVideoCall(otherUserId, conversationId)

    // Reset state
    setIsCallActive(false)
    setIsConnecting(false)
    setCallDuration(0)
    callStartTimeRef.current = 0

    // Call parent callback
    onEndCall()
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
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Video Container */}
      <div className="relative w-full h-full max-w-6xl max-h-4xl">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 bg-gray-900 rounded-2xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Remote User Info */}
          <div className="absolute top-4 left-4 glass-bubble px-4 py-2">
            <h3 className="text-white font-semibold">{otherUserName}</h3>
            {isCallActive && (
              <p className="text-white/70 text-sm">{formatDuration(callDuration)}</p>
            )}
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="glass-strong px-8 py-4 rounded-2xl flex items-center gap-4">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-all duration-300 ${
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
              className={`p-4 rounded-full transition-all duration-300 ${
                isVideoOff 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {isVideoOff ? '📹' : '📷'}
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300"
            >
              📞
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="glass-strong p-8 rounded-2xl text-center">
              <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-white text-xl font-semibold mb-2">Connecting...</h3>
              <p className="text-white/70">Starting video call with {otherUserName}</p>
            </div>
          </div>
        )}

        {/* Start Call Button (if not started) */}
        {!isCallActive && !isConnecting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="glass-strong p-8 rounded-2xl text-center">
              <div className="text-6xl mb-4">📹</div>
              <h3 className="text-white text-xl font-semibold mb-2">Start Video Call</h3>
              <p className="text-white/70 mb-6">Call {otherUserName}</p>
              <button
                onClick={startCall}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
              >
                Start Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
