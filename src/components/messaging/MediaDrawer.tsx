'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MediaDrawerProps {
  isOpen: boolean
  onClose: () => void
  onMediaSelected: (url: string, type: 'photo' | 'video' | 'file', name: string) => void
  conversationId: string
}

type MediaTab = 'camera' | 'gallery' | 'files'

export default function MediaDrawer({
  isOpen,
  onClose,
  onMediaSelected,
  conversationId
}: MediaDrawerProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>('camera')
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Start camera when camera tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !capturedImage) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, activeTab, capturedImage, facingMode])

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const switchCamera = () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Mirror image if using front camera
    if (facingMode === 'user') {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }

    context.drawImage(video, 0, 0)

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageDataUrl)
    stopCamera()

    setTimeout(() => setIsCapturing(false), 300)
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const uploadAndSend = async (file: File | Blob, fileName: string, type: 'photo' | 'video' | 'file') => {
    setIsUploading(true)

    try {
      const ext = fileName.split('.').pop() || 'jpg'
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const filePath = `messages/${conversationId}/${uniqueName}`

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      onMediaSelected(publicUrl, type, fileName)
      handleClose()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const sendCapturedPhoto = async () => {
    if (!capturedImage) return

    // Convert base64 to blob
    const response = await fetch(capturedImage)
    const blob = await response.blob()

    await uploadAndSend(blob, 'photo.jpg', 'photo')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'file') => {
    const file = e.target.files?.[0]
    if (!file) return

    await uploadAndSend(file, file.name, type)
  }

  const handleClose = () => {
    stopCamera()
    setCapturedImage(null)
    setCameraError(null)
    setActiveTab('camera')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-gradient-to-b from-zinc-900 to-black border-t border-white/10 rounded-t-3xl overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-4 pb-4">
          {[
            { id: 'camera' as const, icon: '📷', label: 'Camera' },
            { id: 'gallery' as const, icon: '🖼️', label: 'Gallery' },
            { id: 'files' as const, icon: '📁', label: 'Files' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2
                transition-all duration-300 font-medium
                ${activeTab === tab.id
                  ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/25'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="px-4 pb-8">
          {/* Camera Tab */}
          {activeTab === 'camera' && (
            <div className="relative">
              {cameraError ? (
                <div className="aspect-[4/3] bg-black/50 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                  <div className="text-4xl mb-3">📵</div>
                  <p className="text-white/60 text-sm">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-4 px-4 py-2 bg-lime-400 text-black rounded-xl text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : capturedImage ? (
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full aspect-[4/3] object-cover rounded-2xl"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-3 bg-white/10 backdrop-blur-xl text-white rounded-full font-medium hover:bg-white/20 transition-all"
                    >
                      ↩️ Retake
                    </button>
                    <button
                      onClick={sendCapturedPhoto}
                      disabled={isUploading}
                      className="px-6 py-3 bg-lime-400 text-black rounded-full font-semibold hover:bg-lime-300 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>Send 📤</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`
                      w-full aspect-[4/3] object-cover rounded-2xl bg-black
                      ${facingMode === 'user' ? 'scale-x-[-1]' : ''}
                    `}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6">
                    {/* Switch Camera */}
                    <button
                      onClick={switchCamera}
                      className="p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 transition-all"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    {/* Capture Button */}
                    <button
                      onClick={capturePhoto}
                      className={`
                        w-16 h-16 rounded-full border-4 border-white
                        transition-all duration-150 relative
                        ${isCapturing ? 'scale-90' : 'hover:scale-105'}
                      `}
                    >
                      <div className={`
                        absolute inset-1.5 rounded-full bg-white
                        transition-all duration-150
                        ${isCapturing ? 'scale-75' : ''}
                      `} />
                    </button>

                    {/* Close */}
                    <button
                      onClick={handleClose}
                      className="p-3 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/20 transition-all"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-16 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-lime-400/50 hover:bg-lime-400/5 transition-all"
              >
                {isUploading ? (
                  <>
                    <div className="w-8 h-8 border-3 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
                    <span className="text-white/60">Uploading...</span>
                  </>
                ) : (
                  <>
                    <div className="text-5xl">🖼️</div>
                    <span className="text-white/80 font-medium">Choose from Gallery</span>
                    <span className="text-white/40 text-sm">Photos & Videos</span>
                  </>
                )}
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={e => handleFileSelect(e, e.target.files?.[0]?.type.startsWith('video') ? 'video' : 'photo')}
                className="hidden"
              />
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-16 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-lime-400/50 hover:bg-lime-400/5 transition-all"
              >
                {isUploading ? (
                  <>
                    <div className="w-8 h-8 border-3 border-lime-400/30 border-t-lime-400 rounded-full animate-spin" />
                    <span className="text-white/60">Uploading...</span>
                  </>
                ) : (
                  <>
                    <div className="text-5xl">📎</div>
                    <span className="text-white/80 font-medium">Choose File</span>
                    <span className="text-white/40 text-sm">PDF, DOC, TXT, and more</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx,.zip"
                onChange={e => handleFileSelect(e, 'file')}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
