'use client'

import Link from 'next/link'

const protections = [
  {
    title: 'Data Encryption',
    points: [
      'All data transmitted between your device and our servers is encrypted using industry-standard protocols',
      'Your personal information is encrypted at rest in our secure database infrastructure',
      'Payment information is never stored on our servers and is handled by certified payment processors'
    ],
    icon: '🔐'
  },
  {
    title: 'Account Security',
    points: [
      'Secure authentication with password hashing and session management',
      'Automatic session expiration for inactive accounts',
      'Account recovery options with identity verification'
    ],
    icon: '🛡️'
  },
  {
    title: 'Privacy Controls',
    points: [
      'Block and report features to control who can interact with you',
      'Incognito mode to browse privately',
      'Granular location sharing controls - you choose what to reveal',
      'Delete your account and data at any time'
    ],
    icon: '🧭'
  },
  {
    title: 'Message & Call Security',
    points: [
      'Private messaging between users with secure delivery',
      'Video calls use encrypted connections',
      'Your messages and media are protected with access controls'
    ],
    icon: '💬'
  },
  {
    title: 'Platform Safety',
    points: [
      'Automated monitoring for suspicious activity and security threats',
      'Regular security updates and improvements',
      'Trusted infrastructure providers with security certifications',
      '24/7 incident response procedures'
    ],
    icon: '📈'
  },
  {
    title: 'Your Rights',
    points: [
      'Access and download your personal data',
      'Request corrections to your information',
      'Delete your account and all associated data',
      'Opt out of non-essential data processing'
    ],
    icon: '⚖️'
  }
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Security & Trust</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-4 max-w-5xl mx-auto pb-20">
        <div className="glass-bubble p-8 space-y-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-4">Your Security Matters</h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              We're committed to protecting your privacy and keeping your data secure. Here's how we safeguard your experience on SLTR.
            </p>
            <p className="text-white/40 text-sm mt-2">Last updated: November 2025</p>
          </div>

          <section className="text-white/80 space-y-4 mb-8">
            <p>
              At SLTR, security isn't an afterthought—it's built into everything we do. We use industry-standard security practices to protect your personal information, conversations, and activity on our platform.
            </p>
            <p>
              This page provides an overview of our security measures. For complete details about how we handle your data, please review our{' '}
              <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</Link>{' '}
              and{' '}
              <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 underline">Terms of Service</Link>.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {protections.map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{item.icon}</span>
                  <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  {item.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <section className="space-y-4 text-white/80 bg-white/5 border border-white/10 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-white">Continuous Improvement</h2>
            <p>
              Security is an ongoing commitment. We continuously monitor our systems, perform regular security assessments, and update our practices to address emerging threats. Our team responds quickly to security concerns and works to keep SLTR safe for everyone.
            </p>
          </section>

          <section className="space-y-4 text-white/80 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-white">Report Security Issues</h2>
            <p>
              If you discover a security vulnerability or have concerns about the security of SLTR, please contact us immediately. We take all reports seriously and will investigate promptly.
            </p>
            <div className="space-y-2 text-sm">
              <p><strong className="text-white">Email:</strong> support@getsltr.com</p>
              <p><strong className="text-white">Response Time:</strong> We aim to respond within 24-48 hours</p>
            </div>
            <p className="text-xs text-white/50">
              We appreciate responsible disclosure and may acknowledge security researchers who help us improve SLTR's security.
            </p>
          </section>

          <div className="text-center mt-8">
            <Link
              href="/app"
              className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 py-3 px-8 rounded-2xl text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Back to App
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .gradient-text {
          background: linear-gradient(135deg, #00d4ff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glass-bubble {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border-radius: 24px;
        }
      `}</style>
    </div>
  )
}
