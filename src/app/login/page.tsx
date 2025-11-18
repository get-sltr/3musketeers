'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import SltrButton from '../../components/SltrButton'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      router.push('/app')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to log in')
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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-8">
          <Link 
            href="/"
            className="text-gray-400 hover:text-lime-400 transition-colors text-sm flex items-center gap-2"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-lime-400/20 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-400/5 via-transparent to-lime-400/5" />
          
          <div className="relative z-10">
            {/* Logo */}
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
            <p className="text-gray-400 mb-8">Welcome back</p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-lime-400/30 focus:border-lime-400 text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-lime-400/30 focus:border-lime-400 text-white placeholder-gray-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <Link 
                  href="/forgot-password"
                  className="text-sm text-lime-400 hover:text-lime-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-lime-400 hover:bg-lime-300 text-black font-bold text-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_30px_rgba(204,255,0,0.5)]"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="text-lime-400 hover:text-lime-300 font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </div>

            {/* sltr∝ Link */}
            <div className="mt-6 flex justify-center">
              <SltrButton size="sm" />
            </div>
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
