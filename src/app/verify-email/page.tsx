'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      // Normalize email once from URL: trim and lowercase
      setEmail(emailParam.trim().toLowerCase())
    } else {
      // If no email in URL, redirect to signup
      router.replace('/signup')
    }
  }, [searchParams, router])

  // Auto clear success / error after a few seconds
  useEffect(() => {
    if (!resendSuccess && !resendError) return

    const timer = setTimeout(() => {
      setResendSuccess(false)
      setResendError(null)
    }, 5000)

    return () => clearTimeout(timer)
  }, [resendSuccess, resendError])

  // Handle resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setTimeout(() => {
      setResendCooldown(resendCooldown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return

    setResending(true)
    setResendError(null)
    setResendSuccess(false)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        // Optional: adjust this if you use a custom auth callback route
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        // Provide user-friendly error messages for rate limits
        let errorMessage = error.message
        if (error.message.toLowerCase().includes('rate limit') ||
            error.message.toLowerCase().includes('too many')) {
          errorMessage = 'Too many email requests. Please wait a few minutes before trying again.'
        }
        setResendError(errorMessage)
      } else {
        setResendSuccess(true)
        // Set 60-second cooldown after successful resend to prevent rate limits
        setResendCooldown(60)
      }
    } catch (err) {
      setResendError('Failed to resend email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  // If we do not have an email yet, do not render the main UI
  if (!email) {
    return null
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div
        className="w-full max-w-md p-8 rounded-3xl border border-white/10 backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-2">
            {/* Dot Grid with Bubble Effect */}
            <svg width="50" height="50" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              {[0, 1, 2, 3].map((row) =>
                [0, 1, 2, 3].map((col) => {
                  const x = 15 + col * 20;
                  const y = 15 + row * 20;
                  const isMiddle = (row === 1 || row === 2) && (col === 1 || col === 2);
                  const radius = isMiddle ? 8 : 5;
                  return (
                    <circle
                      key={`${row}-${col}`}
                      cx={x}
                      cy={y}
                      r={radius}
                      fill="#ccff00"
                    />
                  );
                })
              )}
            </svg>
            <div className="text-4xl font-black tracking-[0.3em] text-lime-400">
              sltr
            </div>
          </div>
          <p className="text-white/60 text-sm tracking-widest uppercase mt-2">
            RULES DON&apos;T APPLY
          </p>
        </div>

        {/* Email Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: '#ccff00',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="black"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-3">
            Verify Your Email
          </h2>
          <p className="text-white/70 text-sm mb-2">
            We sent a verification link to:
          </p>
          <p className="text-white font-medium text-lg mb-4">
            {email}
          </p>
          <p className="text-white/60 text-sm">
            Click the link in the email to activate your account and start connecting.
          </p>
        </div>

        {/* Warning Box */}
        <div
          className="p-4 rounded-2xl mb-6"
          style={{
            background: 'rgba(255, 107, 53, 0.1)',
            border: '1px solid rgba(255, 107, 53, 0.3)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="text-orange-400 text-sm font-medium mb-1">
                Check your spam folder
              </p>
              <p className="text-orange-300/80 text-xs">
                If you do not see the email in a few minutes, check your spam or junk folder.
              </p>
            </div>
          </div>
        </div>

        {/* Resend Success */}
        {resendSuccess && (
          <div
            className="p-4 rounded-2xl mb-4"
            style={{
              background: 'rgba(204, 255, 0, 0.1)',
              border: '1px solid rgba(204, 255, 0, 0.3)',
            }}
          >
            <p className="text-lime-400 text-sm text-center">
              ✓ Email sent. Check your inbox.
            </p>
          </div>
        )}

        {/* Resend Error */}
        {resendError && (
          <div
            className="p-4 rounded-2xl mb-4"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <p className="text-red-400 text-sm text-center">
              {resendError}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={resending || resendCooldown > 0 || !email}
            className="w-full py-3 rounded-2xl text-white font-semibold border border-white/20 hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            {resending
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Email'}
          </button>

          <Link
            href="/login"
            className="block w-full py-3 rounded-2xl text-black font-semibold text-center transition-all duration-200 hover:opacity-90"
            style={{
              background: '#ccff00',
            }}
          >
            Go to Login
          </Link>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-white/40 text-xs">
            Still having trouble?{' '}
            <Link
              href="/contact"
              className="text-white/60 hover:text-white underline"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
