'use client'

import { useState } from 'react'
import { submitReport } from '@/lib/safety'
import { createClient } from '@/lib/supabase/client'

interface ReportModalProps {
  userId: string
  username: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ReportModal({ userId, username, isOpen, onClose, onSuccess }: ReportModalProps) {
  const [category, setCategory] = useState<'harassment' | 'fake' | 'inappropriate' | 'spam' | 'other'>('other')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      // Get current user ID
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('You must be logged in to submit a report')
        setSubmitting(false)
        return
      }

      const result = await submitReport({
        reportedUserId: userId,
        reporterUserId: user.id,
        reason,
        category
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        alert(`Failed to submit report: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Failed to submit report. Please try again.')
    }

    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-bubble max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Report {username}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Reason</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full glass-bubble p-3 bg-white/5 outline-none"
            >
              <option value="harassment">Harassment or bullying</option>
              <option value="fake">Fake profile</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Additional details</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide more information..."
              className="w-full glass-bubble p-3 bg-white/5 outline-none h-32 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 glass-bubble py-3 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
