"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        // Exchange the code in the URL for a session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) throw error

        // Decide where to go next
        const next = searchParams.get("next")
        const type = searchParams.get("type") || (typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('type') : null)

        if ((type && type.toLowerCase() === 'recovery') || next === "/reset-password") {
          router.replace("/reset-password")
          return
        }

        router.replace(next || "/app")
      } catch (err: any) {
        console.error("Auth callback error:", err)
        setError(err?.message || "Failed to sign you in. Try the link again or request a new one.")
      }
    }
    run()
  }, [router, searchParams, supabase])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6" />
        <h1 className="text-white text-xl font-semibold mb-2">Signing you in…</h1>
        <p className="text-white/60 text-sm">One moment while we complete your login.</p>
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6" />
          <h1 className="text-white text-xl font-semibold mb-2">Preparing sign-in…</h1>
          <p className="text-white/60 text-sm">Loading…</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
