'use client'

import { useState, useRef } from 'react'

interface MediaActionSheetProps {
  isOpen: boolean
  onClose: () => void
  onTakePhoto: () => void
  onCameraRoll: () => void
  onVideo: () => void
  onMyAlbums: () => void
}

export default function MediaActionSheet({
  isOpen,
  onClose,
  onTakePhoto,
  onCameraRoll,
  onVideo,
  onMyAlbums
}: MediaActionSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleCameraRoll = () => {
    fileInputRef.current?.click()
  }

  const handleVideo = () => {
    videoInputRef.current?.click()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl z-50 animate-[slideUp_0.3s_ease-out] shadow-2xl">
        <div className="p-4">
          {/* Handle bar */}
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />

          {/* Options */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onTakePhoto()
                onClose()
              }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-lime-400/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">Take Photo</div>
                <div className="text-white/60 text-sm">Use your camera</div>
              </div>
            </button>

            <button
              onClick={() => {
                handleCameraRoll()
                onClose()
              }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">Camera Roll</div>
                <div className="text-white/60 text-sm">Choose from photos</div>
              </div>
            </button>

            <button
              onClick={() => {
                handleVideo()
                onClose()
              }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">Video</div>
                <div className="text-white/60 text-sm">Record or choose video</div>
              </div>
            </button>

            <button
              onClick={() => {
                onMyAlbums()
                onClose()
              }}
              className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full bg-orange-400/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">My Albums</div>
                <div className="text-white/60 text-sm">Share from your albums</div>
              </div>
            </button>
          </div>

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="w-full mt-4 p-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onCameraRoll()
          }
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onVideo()
          }
        }}
      />
    </>
  )
}

