'use client'

import { useState, useEffect, useRef } from 'react'

interface DynamicFounderCardProps {
  userId: string
  onShare: (link: string) => void
}

export default function DynamicFounderCard({ userId, onShare }: DynamicFounderCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [nfcSupported, setNfcSupported] = useState(false)
  const [phoneMovement, setPhoneMovement] = useState({ x: 0, y: 0, z: 0 })
  const [uvMode, setUvMode] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const founderLink = `https://getsltr.com/founder?ref=${userId}`

  useEffect(() => {
    // Generate dynamic QR code
    generateQRCode()
    
    // Check NFC support
    checkNFCSupport()
    
    // Setup phone movement detection
    setupPhoneMovement()
    
    // Setup UV mode toggle
    setupUVMode()
  }, [userId])

  const generateQRCode = () => {
    // Generate QR code with SLTR branding
    const qrData = {
      url: founderLink,
      title: 'SLTR Founder Card',
      description: 'RULES DON\'T APPLY - Get lifetime access',
      timestamp: Date.now()
    }
    
    // Create QR code with SLTR colors
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}&color=00d4ff&bgcolor=000000&margin=10`
    setQrCode(qrCodeUrl)
  }

  const checkNFCSupport = () => {
    if ('NDEFReader' in window) {
      setNfcSupported(true)
    }
  }

  const setupPhoneMovement = () => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      const handleMotion = (event: DeviceMotionEvent) => {
        if (event.acceleration) {
          setPhoneMovement({
            x: event.acceleration.x || 0,
            y: event.acceleration.y || 0,
            z: event.acceleration.z || 0
          })
        }
      }
      
      window.addEventListener('devicemotion', handleMotion)
      return () => window.removeEventListener('devicemotion', handleMotion)
    }
  }

  const setupUVMode = () => {
    // Toggle UV mode with double tap
    let tapCount = 0
    let tapTimer: NodeJS.Timeout

    const handleTap = () => {
      tapCount++
      if (tapCount === 1) {
        tapTimer = setTimeout(() => {
          tapCount = 0
        }, 300)
      } else if (tapCount === 2) {
        clearTimeout(tapTimer)
        setUvMode(!uvMode)
        tapCount = 0
      }
    }

    if (cardRef.current) {
      cardRef.current.addEventListener('touchend', handleTap)
    }
  }

  const handleNFCWrite = async () => {
    if (nfcSupported) {
      try {
        const ndef = new (window as any).NDEFReader()
        await ndef.write({
          records: [{
            recordType: 'url',
            data: founderLink
          }]
        })
        alert('NFC data written successfully!')
      } catch (error) {
        console.error('NFC write error:', error)
      }
    }
  }

  const getMovementColor = () => {
    const intensity = Math.sqrt(phoneMovement.x ** 2 + phoneMovement.y ** 2 + phoneMovement.z ** 2)
    const normalizedIntensity = Math.min(intensity / 10, 1)
    
    if (normalizedIntensity > 0.5) {
      return `hsl(${normalizedIntensity * 360}, 100%, 50%)`
    }
    return '#00d4ff'
  }

  const getMovementGradient = () => {
    const intensity = Math.sqrt(phoneMovement.x ** 2 + phoneMovement.y ** 2 + phoneMovement.z ** 2)
    const normalizedIntensity = Math.min(intensity / 10, 1)
    
    return `linear-gradient(${normalizedIntensity * 360}deg, 
      rgba(0, 212, 255, ${normalizedIntensity}) 0%, 
      rgba(255, 0, 255, ${normalizedIntensity}) 50%, 
      rgba(255, 165, 0, ${normalizedIntensity}) 100%)`
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={cardRef}
        className={`relative w-96 h-64 cursor-pointer transition-all duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        } ${uvMode ? 'uv-mode' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ 
          transformStyle: 'preserve-3d',
          background: uvMode 
            ? 'linear-gradient(45deg, #000000, #1a0033, #330066)'
            : getMovementGradient()
        }}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="w-full h-full bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-orange-500/20 rounded-2xl border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between">
            {/* Header with movement effects */}
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-all duration-300"
                style={{
                  transform: `rotate(${phoneMovement.z * 10}deg) scale(${1 + Math.abs(phoneMovement.x) * 0.1})`,
                  boxShadow: `0 0 20px ${getMovementColor()}`
                }}
              >
                SLTR
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Founder Card</h2>
                <p className="text-white/70 text-sm">RULES DON'T APPLY</p>
              </div>
            </div>

            {/* Founder Badge with movement */}
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold text-center transition-all duration-300"
              style={{
                transform: `translateX(${phoneMovement.x * 5}px) translateY(${phoneMovement.y * 5}px)`,
                boxShadow: `0 0 15px ${getMovementColor()}`
              }}
            >
              🔥 FOUNDER'S CIRCLE
            </div>

            {/* Incentive with movement effects */}
            <div 
              className="bg-white/10 border border-cyan-500/30 rounded-xl p-4 transition-all duration-300"
              style={{
                transform: `rotate(${phoneMovement.z * 2}deg)`,
                borderColor: getMovementColor()
              }}
            >
              <h3 className="text-cyan-400 font-bold text-lg mb-2 flex items-center gap-2">
                🔥 Lifetime Membership
              </h3>
              <p className="text-white/90 text-sm">
                Join the founder's circle and get <strong>FREE lifetime access</strong> to all premium features, EROS AI, and exclusive benefits!
              </p>
            </div>

            {/* Movement indicator */}
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>Move your phone to see magic</span>
            </div>
          </div>
        </div>

        {/* Back of Card - Dynamic QR Code */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-red-500/20 rounded-2xl border border-white/20 backdrop-blur-xl p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold mb-2">Your Founder Link</h2>
              <p className="text-white/70 text-sm">RULES DON'T APPLY</p>
            </div>

            {/* Dynamic QR Code */}
            <div className="flex justify-center mb-4">
              <div 
                className="relative"
                style={{
                  transform: `rotate(${phoneMovement.z * 5}deg) scale(${1 + Math.abs(phoneMovement.x) * 0.05})`
                }}
              >
                <img 
                  src={qrCode} 
                  alt="SLTR Founder QR Code"
                  className="w-32 h-32 rounded-xl shadow-2xl"
                  style={{
                    filter: uvMode ? 'invert(1) hue-rotate(180deg)' : 'none',
                    boxShadow: `0 0 20px ${getMovementColor()}`
                  }}
                />
                {/* UV overlay effect */}
                {uvMode && (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-xl animate-pulse"></div>
                )}
              </div>
            </div>

            {/* NFC Section */}
            {nfcSupported && (
              <div className="bg-white/10 border border-purple-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📱</span>
                  <span className="text-white font-semibold text-sm">NFC Enabled</span>
                </div>
                <button
                  onClick={handleNFCWrite}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-300 text-sm"
                >
                  Write to NFC
                </button>
              </div>
            )}

            {/* UV Mode Toggle */}
            <div className="text-center text-white/50 text-xs">
              Double tap for UV mode
            </div>
          </div>
        </div>

        {/* UV Mode Overlay */}
        {uvMode && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,212,255,0.1)_100%)] animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => {/* Close modal */}}
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  )
}
