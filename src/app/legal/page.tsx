'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LegalHubPage() {
  const router = useRouter()

  const legalDocs = [
    {
      title: 'Privacy Policy',
      description: 'Learn how we collect, use, and protect your personal information. Includes GDPR and CCPA compliance.',
      icon: '🔒',
      path: '/privacy',
      highlight: true
    },
    {
      title: 'Terms of Service',
      description: 'User agreement governing your use of SLTR. Includes arbitration agreement and liability terms.',
      icon: '📄',
      path: '/terms',
      highlight: true
    },
    {
      title: 'Community Guidelines',
      description: 'Standards for respectful behavior, safety guidelines, and LGBTQ+ safe space policies.',
      icon: '🌈',
      path: '/guidelines',
      highlight: false
    },
    {
      title: 'Cookie Policy',
      description: 'How we use cookies and similar technologies to improve your experience on SLTR.',
      icon: '🍪',
      path: '/cookies',
      highlight: false
    },
    {
      title: 'Security & Safety',
      description: 'Our security measures, safety features, and how we protect your account and data.',
      icon: '🛡️',
      path: '/security',
      highlight: false
    },
    {
      title: 'DMCA Policy',
      description: 'Copyright infringement reporting and intellectual property protection procedures.',
      icon: '©️',
      path: '/dmca',
      highlight: false
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold gradient-text">Legal Center</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 p-4 max-w-7xl mx-auto pb-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4">
            Legal & Policy Center
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Transparency and trust are core to SLTR. Review our policies, terms, and guidelines to understand your rights and our commitments.
          </p>
        </div>

        {/* Important Notice */}
        <div className="glass-bubble p-6 mb-12 bg-cyan-500/10 border border-cyan-500/30">
          <div className="flex items-start gap-4">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Last Updated: January 2025</h3>
              <p className="text-white/80 text-sm">
                We've recently updated our policies to provide more comprehensive protections and comply with GDPR, CCPA, and other privacy regulations. Please review the changes carefully.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Documents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {legalDocs.map((doc, index) => (
            <button
              key={index}
              onClick={() => router.push(doc.path)}
              className={`glass-bubble p-8 text-left hover:bg-white/10 transition-all duration-300 group relative overflow-hidden ${
                doc.highlight ? 'border-2 border-cyan-500/50' : 'border border-white/20'
              }`}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>

              {/* Content */}
              <div className="relative">
                <div className="text-5xl mb-4">{doc.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {doc.title}
                </h2>
                <p className="text-white/60 text-sm mb-6 line-clamp-3">
                  {doc.description}
                </p>

                {/* Read More Button */}
                <div className="flex items-center gap-2 text-cyan-400 font-semibold group-hover:gap-4 transition-all">
                  <span>Read more</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Highlight badge */}
              {doc.highlight && (
                <div className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/50">
                  ESSENTIAL
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="glass-bubble p-8 bg-white/5">
          <h2 className="text-2xl font-bold text-white mb-6">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>💬</span> Contact & Support
              </h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>
                  <strong>Legal Inquiries:</strong>{' '}
                  <a href="mailto:customersupport@getsltr.com" className="text-cyan-400 hover:underline">
                    customersupport@getsltr.com
                  </a>
                </li>
                <li>
                  <strong>Privacy Requests:</strong>{' '}
                  <a href="mailto:customersupport@getsltr.com" className="text-cyan-400 hover:underline">
                    customersupport@getsltr.com
                  </a>
                </li>
                <li>
                  <strong>DMCA Agent:</strong>{' '}
                  <a href="mailto:customersupport@getsltr.com" className="text-cyan-400 hover:underline">
                    customersupport@getsltr.com
                  </a>
                </li>
                <li>
                  <strong>Advertising & Partnerships:</strong>{' '}
                  <a href="mailto:customersupport@getsltr.com" className="text-cyan-400 hover:underline">
                    customersupport@getsltr.com
                  </a>
                </li>
                <li>
                  <strong>General Support:</strong>{' '}
                  <a href="mailto:customersupport@getsltr.com" className="text-cyan-400 hover:underline">
                    customersupport@getsltr.com
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>⚖️</span> Your Rights
              </h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Right to access your personal data</li>
                <li>• Right to delete your account and data</li>
                <li>• Right to data portability (download your data)</li>
                <li>• Right to opt-out of data sales (CCPA)</li>
                <li>• Right to withdraw consent at any time</li>
                <li>
                  <Link href="/settings" className="text-cyan-400 hover:underline font-semibold">
                    Manage your privacy settings →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm">
            Questions about our policies? Reach out to us at{' '}
            <a href="mailto:customersupport@getsltr.com" className="text-cyan-400 hover:underline">
              customersupport@getsltr.com
            </a>
          </p>
        </div>
      </div>

      {/* Custom Styles */}
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

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
