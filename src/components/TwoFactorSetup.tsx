'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'

export default function TwoFactorSetup() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState<'check' | 'setup' | 'verify' | 'enabled'>('check')

  useEffect(() => {
    checkMFAStatus()
  }, [])

  const checkMFAStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const hasTOTP = factors?.totp && factors.totp.length > 0
      setMfaEnabled(hasTOTP || false)
      setStep(hasTOTP ? 'enabled' : 'check')
    }
  }

  const startMFASetup = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'SLTR Authenticator'
      })

      if (enrollError) throw enrollError

      if (data) {
        setSecret(data.totp.secret)
        // Generate QR code
        const qrCodeUrl = data.totp.qr_code
        const qrDataUrl = await QRCode.toDataURL(qrCodeUrl)
        setQrCode(qrDataUrl)
        setStep('verify')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start 2FA setup')
    } finally {
      setLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const factors = await supabase.auth.mfa.listFactors()
      const factorId = factors.data?.totp?.[0]?.id

      if (!factorId) {
        throw new Error('No factor found')
      }

      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      })

      if (verifyError) throw verifyError

      setSuccess('🎉 Two-factor authentication enabled successfully!')
      setMfaEnabled(true)
      setStep('enabled')
      setTimeout(() => {
        setIsOpen(false)
        setSuccess('')
        setVerifyCode('')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disableMFA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const factors = await supabase.auth.mfa.listFactors()
      const factorId = factors.data?.totp?.[0]?.id

      if (!factorId) {
        throw new Error('No factor found')
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId
      })

      if (unenrollError) throw unenrollError

      setMfaEnabled(false)
      setStep('check')
      setSuccess('Two-factor authentication disabled')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 2FA Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed top-20 right-20 z-50 w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-2xl hover:scale-110 transition-all ${
          mfaEnabled
            ? 'bg-gradient-to-br from-green-600 to-emerald-600 border-white/20'
            : 'bg-gradient-to-br from-yellow-600 to-orange-600 border-white/20 animate-pulse'
        }`}
        title={mfaEnabled ? '2FA Enabled' : 'Setup 2FA'}
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </button>

      {/* 2FA Setup Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-2xl border border-purple-500/30 z-[90] p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    mfaEnabled ? 'bg-gradient-to-br from-green-600 to-emerald-600' : 'bg-gradient-to-br from-yellow-600 to-orange-600'
                  }`}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Two-Factor Auth</h2>
                    <p className="text-xs text-white/60">Extra security layer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Error/Success Messages */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
                    {success}
                  </div>
                )}

                {/* Check Status */}
                {step === 'check' && (
                  <div className="text-center">
                    <div className="mb-4 p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                      <svg className="w-16 h-16 mx-auto mb-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-white font-bold text-lg mb-2">2FA Not Enabled</h3>
                      <p className="text-white/70 text-sm mb-4">
                        Secure your account with two-factor authentication. You'll need your phone each time you log in.
                      </p>
                    </div>
                    <button
                      onClick={startMFASetup}
                      disabled={loading}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {loading ? 'Setting up...' : 'Enable 2FA'}
                    </button>
                  </div>
                )}

                {/* Setup with QR Code */}
                {step === 'verify' && (
                  <div>
                    <div className="text-center mb-4">
                      <h3 className="text-white font-bold text-lg mb-2">Scan QR Code</h3>
                      <p className="text-white/70 text-sm">
                        Use Google Authenticator, Authy, or any TOTP app
                      </p>
                    </div>

                    {qrCode && (
                      <div className="bg-white p-4 rounded-xl mb-4">
                        <img src={qrCode} alt="QR Code" className="w-full" />
                      </div>
                    )}

                    <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-white/60 mb-1">Or enter this code manually:</p>
                      <code className="text-white font-mono text-sm break-all">{secret}</code>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl font-bold tracking-widest mb-4"
                      maxLength={6}
                    />

                    <button
                      onClick={verifyAndEnable}
                      disabled={loading || verifyCode.length !== 6}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                )}

                {/* Enabled Status */}
                {step === 'enabled' && (
                  <div className="text-center">
                    <div className="mb-4 p-6 rounded-xl bg-green-500/10 border border-green-500/30">
                      <svg className="w-16 h-16 mx-auto mb-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-white font-bold text-lg mb-2">2FA Enabled ✓</h3>
                      <p className="text-white/70 text-sm">
                        Your account is now protected with two-factor authentication
                      </p>
                    </div>
                    <button
                      onClick={disableMFA}
                      disabled={loading}
                      className="w-full px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-semibold hover:bg-red-500/30 transition disabled:opacity-50"
                    >
                      {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
