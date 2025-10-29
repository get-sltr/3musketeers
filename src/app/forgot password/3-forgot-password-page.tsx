'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ForgotPasswordPage() {
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center px-4">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        animation: 'gridMove 20s linear infinite'
      }} />

      {/* Neon Glows */}
      <div className="fixed top-[-200px] left-[-100px] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="fixed bottom-[-200px] right-[-100px] w-[600px] h-[600px] bg-magenta-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <div className="mb-8">
          <Link 
            href="/login"
            className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center gap-2"
          >
            ← Back to Log In
          </Link>
        </div>

        {/* Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/20 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-magenta-500/5" />
          
          <div className="relative z-10">
            {/* Logo */}
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-500 mb-2">
              SLTR
            </h1>
            <p className="text-gray-400 mb-8">Reset your password</p>

            {success ? (
              <div className="p-6 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400">
                <p className="font-semibold mb-2">Check your email</p>
                <p className="text-sm text-gray-300">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Click the link in the email to reset your password.
                </p>
                <div className="mt-6">
                  <Link 
                    href="/login"
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
                  >
                    ← Back to Log In
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleResetRequest} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-500 outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Enter the email associated with your account
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-magenta-500 text-black font-bold text-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-transform shadow-[0_0_30px_rgba(0,255,255,0.5)]"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                {/* Remember Password Link */}
                <div className="mt-8 text-center">
                  <p className="text-gray-400 text-sm">
                    Remember your password?{' '}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                      Log in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
      `}</style>
    </div>
  )
}
