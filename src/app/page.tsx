'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    // Get real user count from database
    const getRealUserCount = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        if (count && count > 0) {
          setUserCount(count)
        } else {
          // If no users yet, show a small number or "New"
          setUserCount(0)
        }
      } catch (error) {
        console.log('Could not fetch user count, showing 0')
        setUserCount(0)
      }
    }
    
    getRealUserCount()

    // Mouse tracking for parallax
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const features = [
    {
      icon: '📍',
      title: 'Location-Based',
      description: 'See who\'s nearby right now. Distance and ETA to every profile.',
      gradient: 'from-cyan-500 to-blue-600',
      delay: '0s'
    },
    {
      icon: '⚡',
      title: 'Instant Connections',
      description: 'Real-time messaging. Know who\'s available right now.',
      gradient: 'from-yellow-500 to-orange-600',
      delay: '0.2s'
    },
    {
      icon: '🎯',
      title: 'Smart Matching',
      description: 'Filter by position, kinks, interests. Find exactly what you\'re looking for.',
      gradient: 'from-pink-500 to-purple-600',
      delay: '0.4s'
    },
    {
      icon: '✨',
      title: 'Favorites',
      description: 'Save profiles you like. Build your collection. Come back anytime.',
      gradient: 'from-purple-500 to-pink-600',
      delay: '0.6s'
    },
    {
      icon: '🔒',
      title: 'Safe & Private',
      description: 'Block, report, and control who sees you. Your safety matters.',
      gradient: 'from-green-500 to-teal-600',
      delay: '0.8s'
    },
    {
      icon: '🥳',
      title: 'Your Vibe',
      description: 'Show your status. Party friendly? DTFN? Let people know.',
      gradient: 'from-red-500 to-pink-600',
      delay: '1s'
    }
  ]

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Dynamic Background with Mouse Parallax */}
      <div className="fixed inset-0">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
        <div 
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>

      {/* Animated Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {mounted && (
          <>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/40 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${4 + Math.random() * 6}s`,
                  transform: `translate(${mousePosition.x * (0.001 * (i % 3))}px, ${mousePosition.y * (0.001 * (i % 3))}px)`
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="flex justify-between items-center">
          <div className="text-white text-4xl font-black tracking-wider">
            <span className="bg-gradient-to-r from-cyan-400 to-pink-600 bg-clip-text text-transparent animate-gradient">
              SLTR
            </span>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/login"
              className="px-6 py-3 rounded-full text-white/80 hover:text-white transition-all duration-300 hover:bg-white/10 backdrop-blur-sm"
            >
              Login
            </Link>
            <Link 
              href="/signup"
              className="px-8 py-3 rounded-full text-white font-semibold hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)'
              }}
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-7xl mx-auto">
          {/* Main Logo with Advanced Effects */}
          <div className="relative mb-8">
            <h1 
              className={`text-[8rem] md:text-[15rem] font-black tracking-wider transition-all duration-1000 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #ff00ff, #00d4ff)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradient 3s ease infinite',
                textShadow: '0 0 50px rgba(0, 212, 255, 0.5)',
                filter: 'drop-shadow(0 0 30px rgba(255, 0, 255, 0.3))'
              }}
            >
              SLTR
            </h1>
            
            {/* Glitch Effect Overlay */}
            <div 
              className="absolute inset-0 text-[8rem] md:text-[15rem] font-black tracking-wider opacity-0 hover:opacity-20 transition-opacity duration-300"
              style={{
                background: 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                transform: 'translate(2px, 0)',
                animation: 'glitch 0.3s infinite'
              }}
            >
              SLTR
            </div>
          </div>

          {/* Tagline with Typewriter Effect */}
          <p 
            className={`text-4xl md:text-5xl text-white/90 mb-8 font-light tracking-widest transition-all duration-1000 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
            style={{
              textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
            }}
          >
            RULES DON&apos;T APPLY
          </p>

          {/* Subheading */}
          <p 
            className={`text-2xl md:text-3xl text-white/70 mb-8 max-w-4xl mx-auto transition-all duration-1000 delay-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Connect with nearby guys instantly. No games, no waiting, just real connections.
          </p>

          {/* Early Adopter Message */}
          {userCount === 0 && (
            <div 
              className={`glass-bubble px-8 py-4 mb-8 max-w-2xl mx-auto transition-all duration-1000 delay-600 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 255, 0.1))',
                border: '1px solid rgba(0, 212, 255, 0.3)'
              }}
            >
              <p className="text-cyan-300 text-lg font-semibold text-center">
                🚀 Be among the first to join SLTR - Early access now open!
              </p>
            </div>
          )}

          {/* Live Stats with Hover Effects */}
          <div 
            className={`flex justify-center gap-8 mb-20 transition-all duration-1000 delay-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {[
              { 
                value: userCount > 0 ? `${userCount.toLocaleString()}+` : 'New', 
                label: userCount > 0 ? 'Active Users' : 'Just Launched', 
                color: 'from-cyan-400 to-blue-500' 
              },
              { value: '24/7', label: 'Always On', color: 'from-purple-400 to-pink-500' },
              { value: '∞', label: 'Possibilities', color: 'from-yellow-400 to-orange-500' }
            ].map((stat, index) => (
              <div 
                key={index}
                className="glass-bubble px-10 py-6 hover:scale-110 transition-all duration-300 cursor-pointer group"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <div 
                  className={`text-5xl font-bold text-white mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons with Advanced Effects */}
          <div 
            className={`flex flex-col sm:flex-row gap-8 justify-center items-center transition-all duration-1000 delay-900 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <Link
              href="/signup"
              className="group relative px-20 py-8 text-3xl font-bold text-white rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
                boxShadow: '0 0 50px rgba(0, 212, 255, 0.4)'
              }}
            >
              <span className="relative z-10">Join Now - It&apos;s Free</span>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Link>

            <Link
              href="/app"
              className="glass-bubble px-20 py-8 text-3xl font-semibold text-white hover:bg-white/20 transition-all duration-300 rounded-3xl hover:scale-105"
            >
              Explore App
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section with Staggered Animation */}
      <section className="relative z-10 py-40 px-4">
        <div className="max-w-8xl mx-auto">
          <h2 className="text-6xl md:text-7xl font-bold text-white text-center mb-24">
            Why <span className="bg-gradient-to-r from-cyan-400 to-pink-600 bg-clip-text text-transparent">SLTR</span>?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-bubble p-10 hover:scale-105 transition-all duration-500 group cursor-pointer"
                style={{
                  animationDelay: feature.delay,
                  animation: mounted ? 'fadeInUp 0.8s ease-out forwards' : 'none',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(30px)'
                }}
              >
                <div className="text-8xl mb-8 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-cyan-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/70 text-xl leading-relaxed group-hover:text-white/90 transition-colors">
                  {feature.description}
                </p>
                <div className={`mt-6 h-1 bg-gradient-to-r ${feature.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with Interactive Steps */}
      <section className="relative z-10 py-40 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-6xl md:text-7xl font-bold text-white text-center mb-24">
            Get Started in <span className="bg-gradient-to-r from-cyan-400 to-pink-600 bg-clip-text text-transparent">3 Steps</span>
          </h2>

          <div className="space-y-20">
            {[
              {
                step: 1,
                title: "Create Your Profile",
                description: "Add photos, set your position, select your interests. Takes 2 minutes.",
                icon: "👤",
                color: "from-cyan-500 to-blue-600"
              },
              {
                step: 2,
                title: "Browse Nearby",
                description: "See who's around you. Filter by what matters. Check their vibe.",
                icon: "🔍",
                color: "from-purple-500 to-pink-600"
              },
              {
                step: 3,
                title: "Connect Instantly",
                description: "Send a message. Make plans. Meet up. That's it.",
                icon: "💬",
                color: "from-yellow-500 to-orange-600"
              }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-12 group">
                <div className="glass-bubble w-32 h-32 flex items-center justify-center flex-shrink-0 text-6xl group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-6 mb-6">
                    <div className={`glass-bubble w-16 h-16 flex items-center justify-center bg-gradient-to-r ${item.color}`}>
                      <span className="text-3xl font-bold text-white">{item.step}</span>
                    </div>
                    <h3 className="text-4xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-white/70 text-2xl group-hover:text-white/90 transition-colors">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-20">
            <Link
              href="/signup"
              className="inline-block px-20 py-8 text-3xl font-bold text-white rounded-3xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
                boxShadow: '0 0 50px rgba(0, 212, 255, 0.4)'
              }}
            >
              <span className="relative z-10">Start Your Journey</span>
              <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h4 className="text-white font-bold mb-6 text-2xl">Company</h4>
              <ul className="space-y-3 text-white/60">
                <li><Link href="/about" className="hover:text-white transition-colors text-lg">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors text-lg">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors text-lg">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-2xl">Legal</h4>
              <ul className="space-y-3 text-white/60">
                <li><Link href="/terms" className="hover:text-white transition-colors text-lg">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors text-lg">Privacy Policy</Link></li>
                <li><Link href="/guidelines" className="hover:text-white transition-colors text-lg">Community Guidelines</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-2xl">Support</h4>
              <ul className="space-y-3 text-white/60">
                <li><Link href="/help" className="hover:text-white transition-colors text-lg">Help Center</Link></li>
                <li><Link href="/safety" className="hover:text-white transition-colors text-lg">Safety Tips</Link></li>
                <li><Link href="/report" className="hover:text-white transition-colors text-lg">Report Abuse</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 text-2xl">Follow Us</h4>
              <div className="flex gap-4">
                <a href="#" className="glass-bubble p-4 hover:bg-white/20 transition-all text-2xl">
                  𝕏
                </a>
                <a href="#" className="glass-bubble p-4 hover:bg-white/20 transition-all text-2xl">
                  📷
                </a>
                <a href="#" className="glass-bubble p-4 hover:bg-white/20 transition-all text-2xl">
                  📘
                </a>
              </div>
            </div>
          </div>

          <div className="text-center text-white/40 text-lg border-t border-white/10 pt-8">
            <p>© 2025 SLTR DIGITAL LLC. All rights reserved.</p>
            <p className="mt-2">Made with ❤️ for the community</p>
          </div>
        </div>
      </footer>

      {/* Advanced Custom Animations */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .glass-bubble {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 24px;
        }
      `}</style>
    </div>
  )
}