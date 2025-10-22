'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PanicButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handlePanic = async () => {
    const supabase = createClient()
    
    // Sign out
    await supabase.auth.signOut()
    
    // Clear all local data
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    
    // Redirect to a safe page (e.g., Google)
    window.location.href = 'https://www.google.com'
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl z-50 hover:scale-110 transition-all duration-300"
        title="AI Assistant"
      >
        🤖
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-bubble max-w-sm w-full p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-red-400">Emergency Exit?</h2>
            <p className="text-gray-300 mb-6">
              This will immediately log you out, clear all data, and redirect to Google.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 glass-bubble py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePanic}
                className="flex-1 bg-red-500 py-3 rounded-xl font-semibold"
              >
                Exit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
