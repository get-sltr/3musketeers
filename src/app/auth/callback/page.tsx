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
        let session = null
        let user = null

        // Handle hash fragments first (Supabase recovery flow often returns tokens in the hash)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const tokenHash = hashParams.get('token_hash')
          const typeParam = hashParams.get('type')
          const emailParam = hashParams.get('email')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (error) throw error
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
          } else if (tokenHash && emailParam && typeParam) {
            const { error } = await supabase.auth.verifyOtp({
              type: typeParam as any,
              token_hash: tokenHash,
              email: emailParam,
            })
            if (error) throw error
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
          }
        }

        // Attempt code exchange if the URL contains an auth code (PKCE)
        const codeParam =
          searchParams?.get('code') ??
          (typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('code') : null)
        if (codeParam) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
          if (error) throw error
        }

        // Retrieve the current session
        const { data: sessionData } = await supabase.auth.getSession()
        session = sessionData.session ?? null
        user = session?.user ?? null

        // Check if this is email verification (first time email_confirmed_at is set)
        if (user && user.email_confirmed_at) {
          // Get user profile to check if welcome email was already sent
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('id', user.id)
            .single()

          // Send welcome email (if not already sent)
          try {
            await fetch('/api/emails/welcome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: user.email,
                name: profile?.display_name || user.user_metadata?.username || 'there',
                username: profile?.display_name || user.user_metadata?.username,
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
        const message = err?.message || ''
        if (message.includes('auth code') && message.includes('code verifier')) {
          setError('Your email is verified. Please sign in on this device to continue.')
          setTimeout(() => {
            router.replace('/login?message=Email verified! Sign in to continue.')
          }, 3000)
        } else {
          setError(message || "Failed to sign you in. Try the link again or request a new one.")
        }
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
