'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SltrButton from '../../components/SltrButton'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ageError, setAgeError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tier, setTier] = useState<'free' | 'member' | 'founder' | 'blackcard'>('free')

  useEffect(() => {
    const tierParam = searchParams?.get('tier')
    if (tierParam === 'blackcard' || tierParam === 'founder' || tierParam === 'member' || tierParam === 'free') {
      setTier(tierParam)
    }
  }, [searchParams])

  // Import URL utility - will be imported dynamically in the function

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('One number')
    if (!/[!@#$%^&*]/.test(password)) errors.push('One special character (!@#$%^&*)')
    
    return { valid: errors.length === 0, errors }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAgeError(null)

    // Age verification
    const age = calculateAge(dateOfBirth)
    if (age < 18) {
      setAgeError('You must be 18 or older to use SLTR')
      setLoading(false)
      return
    }

    // Password validation
    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      setError(`Password must have: ${passwordCheck.errors.join(', ')}`)
      setLoading(false)
      return
    }

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (username.length < 3 || username.length > 20) {
      setError('Username must be 3-20 characters')
      setLoading(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      setLoading(false)
      return
    }

    // Always use production URL (getsltr.com) for redirects
    const { getAuthCallbackUrl } = await import('@/lib/utils/url')
    const redirectUrl = getAuthCallbackUrl('/app')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          username,
          age: age,
          date_of_birth: dateOfBirth
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      // Create profile in profiles table with all required fields
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: username,
          age: age,
          photos: [], // Initialize empty photos array
          kinks: [], // Initialize empty kinks array
          tags: [], // Initialize empty tags array
          party_friendly: false, // Default to false
          dtfn: false, // Default to false
          online: false, // Default to offline
          subscription_tier: tier, // Store selected tier
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Still continue to verification page
      }
      
      // Redirect to verify-email page to confirm email
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md p-8 rounded-3xl border border-white/10 backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-2">
            {/* Dot Grid with Bubble Effect */}
            <svg width="50" height="50" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SLTR logo">
              <title>SLTR Logo</title>
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
            RULES DON'T APPLY
          </p>
        </div>

        {/* Tier Selection Banner */}
        {tier === 'blackcard' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-900 via-black to-gray-900 border border-white/20 rounded-2xl text-center">
            <div className="text-2xl mb-1">♠️</div>
            <div className="text-white font-bold">Black Card</div>
            <div className="text-xs text-gray-300">$999 Lifetime Elite</div>
          </div>
        )}
        {tier === 'founder' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-2xl text-center">
            <div className="text-2xl mb-1">👑</div>
            <div className="text-amber-400 font-bold">Founder's Circle</div>
            <div className="text-xs text-amber-300/80">$199 Lifetime Access</div>
          </div>
        )}
        {tier === 'member' && (
          <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/50 rounded-2xl text-center">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-cyan-400 font-bold">Premium Member</div>
            <div className="text-xs text-cyan-300/80">$12.99/month</div>
          </div>
        )}
        {tier === 'free' && (
          <div className="mb-6 p-4 bg-magenta-500/10 border border-magenta-500/50 rounded-2xl text-center">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-magenta-400 font-bold">Free Account</div>
            <div className="text-xs text-magenta-300/80">No credit card needed</div>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="Username (3-20 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px'
              }}
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px'
              }}
              required
            />
          </div>

          {/* Date of Birth */}
          <div className="glass-bubble p-4">
            <label htmlFor="dateOfBirth" className="text-sm text-gray-400 mb-2 block">Date of Birth</label>
            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-transparent text-white outline-none"
              required
              aria-describedby="dob-hint"
            />
            <span id="dob-hint" className="sr-only">You must be 18 or older to use SLTR</span>
          </div>

          <div className="glass-bubble p-4">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder-gray-400"
              required
            />
            {password && (
              <div className="mt-2">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      validatePassword(password).valid 
                        ? 'bg-green-500 w-full' 
                        : 'bg-yellow-500 w-1/2'
                    }`}
                  />
                </div>
                {!validatePassword(password).valid && (
                  <p className="text-xs text-gray-400 mt-1">
                    {validatePassword(password).errors.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px'
              }}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2 px-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl text-black font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: '#ccff00',
              borderRadius: '16px'
            }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {/* Age Error Display */}
        {ageError && (
          <div className="glass-bubble bg-red-500/10 border-red-500/50 p-4 mb-4">
            <p className="text-red-400 text-sm">{ageError}</p>
            <p className="text-red-300 text-xs mt-2">SLTR is only available to adults 18+</p>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-lime-400 hover:text-lime-300 hover:underline font-medium"
            >
              Login
            </Link>
          </p>
        </div>

        {/* sltr∝ Link */}
        <div className="mt-6 flex justify-center">
          <SltrButton size="sm" />
        </div>

        <p className="text-center text-white/40 text-xs mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
