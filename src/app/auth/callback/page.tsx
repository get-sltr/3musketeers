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
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (error) throw error

        // Check if this is email verification (first time email_confirmed_at is set)
        if (data.session?.user && data.session.user.email_confirmed_at) {
          // Get user profile to check if welcome email was already sent
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', data.session.user.id)
            .single()

          // Send welcome email (if not already sent)
          try {
            await fetch('/api/emails/welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: data.session.user.email,
                name: profile?.display_name || data.session.user.user_metadata?.username || 'there',
                username: profile?.display_name || data.session.user.user_metadata?.username,
              }),
            })
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError)
            // Don't fail auth if email fails
          }
        }

        // Decide where to go next
        const params = searchParams ?? (typeof window !== 'undefined' ? new URL(window.location.href).searchParams : null)
        const next = params?.get("next")
        const type = params?.get("type") || (typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('type') : null)

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
