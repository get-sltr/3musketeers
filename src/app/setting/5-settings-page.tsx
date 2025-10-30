'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Change Email States
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailError, setEmailError] = useState('')

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [router, supabase])

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')
    setEmailLoading(true)

    try {
      // Re-authenticate first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailPassword
      })

      if (signInError) throw new Error('Current password is incorrect')

      // Update email
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (updateError) throw updateError

      setEmailSuccess('Check your new email for confirmation link')
      setNewEmail('')
      setEmailPassword('')
    } catch (err: any) {
      setEmailError(err.message || 'Failed to update email')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordLoading(true)

    try {
      // Re-authenticate first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) throw new Error('Current password is incorrect')

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setPasswordSuccess('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
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

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-cyan-400 transition-colors text-sm mb-6"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-magenta-500 mb-2">
            Account Settings
          </h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>

        {/* Current Email */}
        <div className="mb-12 bg-black/40 backdrop-blur-xl border border-cyan-500/20 p-6">
          <p className="text-gray-400 text-sm mb-2">Current Email</p>
          <p className="text-white text-lg font-semibold">{user.email}</p>
        </div>

        {/* Change Email Section */}
        <div className="mb-12 bg-black/40 backdrop-blur-xl border border-cyan-500/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Change Email</h2>

          {emailSuccess && (
            <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 text-sm">
              {emailSuccess}
            </div>
          )}

          {emailError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {emailError}
            </div>
          )}

          <form onSubmit={handleChangeEmail} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-500 outline-none transition-colors"
                placeholder="new@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password (to confirm)
              </label>
              <input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-magenta-500 text-black font-bold hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
            >
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="mb-12 bg-black/40 backdrop-blur-xl border border-cyan-500/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>

          {passwordSuccess && (
            <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 text-sm">
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-500 outline-none transition-colors"
                placeholder="••••••••"
              />
              <p className="mt-2 text-sm text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 focus:border-cyan-500 text-white placeholder-gray-500 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-magenta-500 text-black font-bold hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="px-8 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold transition-all"
          >
            Log Out
          </button>
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
