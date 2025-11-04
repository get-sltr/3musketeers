'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (session.user.email_confirmed_at) {
          router.push('/profile/setup')
        }
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Please enter your email address')
      return
    }

    setResendLoading(true)
    setMessage('')

    // Always use production URL (getsltr.com) for redirects
    const { getAuthCallbackUrl } = await import('@/lib/utils/url')
    const redirectUrl = getAuthCallbackUrl('/app')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: { emailRedirectTo: redirectUrl }
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Verification email sent! Check your inbox.')
      }
    } catch (err) {
      setMessage('Failed to send verification email. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
          <p className="text-white/60">
            We've sent a verification link to your email address
          </p>
        </div>

        <div className="glass-bubble p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Check Your Inbox</h3>
                <p className="text-white/60 text-sm">
                  Look for an email from SLTR with the subject "Verify your email"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Click the Link</h3>
                <p className="text-white/60 text-sm">
                  Click the verification link in the email to activate your account
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-cyan-400 text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Complete Profile</h3>
                <p className="text-white/60 text-sm">
                  You'll be redirected to create your profile
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3"
                placeholder="Enter your email"
              />
            </div>

            <button
              onClick={handleResendEmail}
              disabled={resendLoading || !email}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 py-3 rounded-2xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>

          {message && (
            <div className={`p-4 rounded-2xl ${
              message.includes('sent') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="glass-bubble p-4 bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-lg">⚠️</span>
              <div>
                <h4 className="text-white font-semibold mb-1">Didn't receive the email?</h4>
                <ul className="text-white/60 text-sm space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you used a real email address</li>
                  <li>• Wait a few minutes and try again</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/login"
              className="flex-1 glass-bubble py-3 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all duration-300 text-center"
            >
              Back to Login
            </Link>
            <Link
              href="/signup"
              className="flex-1 glass-bubble py-3 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all duration-300 text-center"
            >
              Try Different Email
            </Link>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-white/40 text-sm">
            Having trouble? Contact us at{' '}
            <a href="mailto:support@sltr.app" className="text-cyan-400 hover:text-cyan-300">
              support@sltr.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}


