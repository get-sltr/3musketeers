'use client'

import { useState, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  conversationId: string
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void
}

export default function FileUpload({ conversationId, onFileUploaded }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { shareFile } = useSocket()
  const supabase = createClient()

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Determine file extension
      const fileExt = file.name.split('.').pop() || 'bin'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `messages/${fileName}`

      console.log('Uploading file to Supabase:', filePath)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      console.log('File uploaded successfully:', publicUrl)

      // Notify other users about file share
      shareFile(conversationId, file.name, file.type, file.size)

      // Call the callback
      onFileUploaded(publicUrl, file.name, file.type)

      setUploadProgress(100)
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative">
      {/* File Upload Button */}
      <button
        onClick={openFileDialog}
        disabled={isUploading}
        className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            📎 Attach File
          </>
        )}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        className="hidden"
      />

      {/* Drag and Drop Overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          dragActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="glass-strong p-8 rounded-2xl text-center max-w-md">
          <div className="text-6xl mb-4">📎</div>
          <h3 className="text-xl font-bold text-white mb-2">Drop your file here</h3>
          <p className="text-white/70">Images, videos, documents supported</p>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="absolute top-full left-0 right-0 mt-2">
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
