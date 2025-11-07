'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const tokenHash = hashParams.get('token_hash')
          const typeParam = hashParams.get('type')
          const emailParam = hashParams.get('email')

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
          } else if (tokenHash && emailParam && typeParam) {
            await supabase.auth.verifyOtp({
              type: typeParam as any,
              token_hash: tokenHash,
              email: emailParam,
            })
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session && isMounted) {
          setError('Invalid or expired reset link. Please request a new one.')
        }
      } catch (err: any) {
        console.error('Reset password session error:', err)
        if (isMounted) {
          setError('Invalid or expired reset link. Please request a new one.')
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage('Password updated successfully! Redirecting...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">New Password</h1>
          <p className="text-white/60 text-sm">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="glass-bubble p-3 bg-red-500/10 border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="glass-bubble p-3 bg-green-500/10 border-green-500/20">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-button py-3 text-white font-bold disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-white/60 hover:text-white text-sm">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
