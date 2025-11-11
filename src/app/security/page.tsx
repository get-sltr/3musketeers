'use client'

import Link from 'next/link'

const safeguards = [
  {
    title: 'Infrastructure & Hosting',
    points: [
      'Production hosted on Vercel with automatic SSL, WAF, and global edge network',
      'Primary data stored in Supabase (Postgres) with daily snapshot backups',
      'Media and realtime messaging served over HTTPS with HSTS enforced'
    ],
    icon: '🛡️'
  },
  {
    title: 'Authentication & Access Control',
    points: [
      'Supabase Auth with hashed passwords, magic links, and optional OAuth',
      'Short-lived JWT access tokens, refresh rotation, and session inactivity timeouts',
      'Role-based and intent-based permissions for founders, moderators, and members'
    ],
    icon: '🔐'
  },
  {
    title: 'Database Security',
    points: [
      'Row Level Security (RLS) for profiles, messages, albums, favorites, and blocks',
      'Stored procedures perform server-side validation before inserts/updates',
      'Audit logging for sensitive actions (block/report, payment, verification)'
    ],
    icon: '🗃️'
  },
  {
    title: 'Messaging & Calls',
    points: [
      'Socket rooms namespaced per conversation – no cross-room leakage',
      'Daily.co generates one-time room tokens; media streams are encrypted end-to-end',
      'Media attachments stored in signed Supabase buckets with expiring URLs'
    ],
    icon: '💬'
  },
  {
    title: 'Monitoring & Response',
    points: [
      'Automated alerts for auth failures, RLS violations, and API anomalies',
      'Daily log captures deploys, schema changes, and security notices',
      'Incident playbook covers containment, member notification, and postmortems'
    ],
    icon: '📈'
  },
  {
    title: 'User Controls & Privacy',
    points: [
      'Granular location sharing, incognito toggle, and manual relocation safeguards',
      'Block, report, and DTFN safety signals available in one tap',
      'Export/delete ready – members can request account removal at any time'
    ],
    icon: '🧭'
  }
]

const partners = [
  {
    name: 'Supabase',
    desc: 'Postgres-backed auth, storage, and realtime with managed backups and SOC2 roadmap'
  },
  {
    name: 'Daily.co',
    desc: 'Managed WebRTC infrastructure with HIPAA-aligned encryption and TURN coverage'
  },
  {
    name: 'Stripe',
    desc: 'PCI-DSS compliant billing, Radar fraud checks, and webhook signature verification'
  },
  {
    name: 'Resend',
    desc: 'Transactional email delivery with domain verification and DMARC alignment'
  }
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 z-50">
        <div className="flex items-center justify-between">
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
      <div className="pt-20 p-4 max-w-5xl mx-auto">
        <div className="glass-bubble p-8 space-y-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">How We Protect Your Data</h1>
            <p className="text-white/60">Last updated: November 2025</p>
          </div>

          <section className="text-white/80 space-y-4">
            <p>
              SLTR is built for real connections, which means safeguarding our community comes first. Our
              security program combines hardened infrastructure, strict data access policies, and rapid
              incident response so members always stay in control of their information.
            </p>
            <p>
              This page highlights the protections that ship with the platform today. For legal specifics,
              see our <Link href="/privacy" className="text-cyan-400 hover:text-cyan-200">Privacy Policy</Link>{' '}
              and <Link href="/terms" className="text-cyan-400 hover:text-cyan-200">Terms of Service</Link>.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            {safeguards.map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{item.icon}</span>
                  <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                </div>
                <ul className="list-disc list-inside text-sm text-white/70 space-y-2">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <section className="space-y-4 text-white/80">
            <h2 className="text-2xl font-bold text-white">Incident Response</h2>
            <p>
              We maintain a runbook covering detection, containment, and communication. Critical incidents
              trigger immediate alerts to the core team, 24/7 paging, and a targeted member notification if
              their data is impacted. Post-incident reviews document root cause and hardening steps.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {[
                'Automated alerts for auth failures & anomalous API traffic',
                'Manual review queue for reported content and safety signals',
                'Quarterly chaos tests of backup restore & policy enforcement'
              ].map((item) => (
                <div key={item} className="glass-bubble p-4 bg-white/5 border border-white/10 text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 text-white/80">
            <h2 className="text-2xl font-bold text-white">Trusted Partners</h2>
            <p>
              We choose vendors with mature security programs and clear compliance roadmaps. Each integration
              is scoped to the minimum permissions required for SLTR to operate.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {partners.map((partner) => (
                <div key={partner.name} className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">{partner.name}</h3>
                  <p className="text-sm text-white/70">{partner.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 text-white/80">
            <h2 className="text-2xl font-bold text-white">Responsible Disclosure</h2>
            <p>
              Found a vulnerability or have questions about our security posture? Reach out directly so we can
              investigate and respond quickly. We appreciate reports from researchers and community members.
            </p>
            <div className="glass-bubble p-5 bg-white/5 border border-white/10 text-sm text-white/70 space-y-2">
              <p><strong>Email:</strong> support@getsltr.com</p>
              <p><strong>Signal:</strong> +1 (213) 756-8086</p>
              <p><strong>Mailing Address:</strong> SLTR DIGITAL LLC • Los Angeles, CA</p>
            </div>
          </section>

          <section className="space-y-4 text-white/80">
            <h2 className="text-2xl font-bold text-white">Roadmap & Continuous Improvement</h2>
            <p>
              Near-term upgrades include SSO for moderators, member-facing device history, granular album
              ACLs, and automated penetration testing. Progress is tracked in our internal security backlog
              and summarized in the daily release notes before every deploy.
            </p>
          </section>

          <div className="text-center mt-8">
            <Link
              href="/app"
              className="inline-block bg-gradient-to-r from-cyan-500 to-purple-500 py-3 px-8 rounded-2xl text-white font-semibold hover:scale-105 transition-all duration-300"
            >
              Back to App
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

