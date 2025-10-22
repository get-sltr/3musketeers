'use client'

import Link from 'next/link'

export default function TermsPage() {
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
          <h1 className="text-2xl font-bold gradient-text">Terms of Service</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-4 max-w-4xl mx-auto">
        <div className="glass-bubble p-8 space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-white/60">Last updated: January 2025</p>
          </div>

          <div className="space-y-6 text-white/80">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using SLTR ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Age Requirement</h2>
              <p>
                You must be at least 18 years old to use SLTR. By using our service, you represent and warrant that you are 18 years of age or older. We reserve the right to verify your age at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
              <p>As a user of SLTR, you agree to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Provide accurate and truthful information</li>
                <li>Respect other users and maintain appropriate conduct</li>
                <li>Not engage in harassment, abuse, or illegal activities</li>
                <li>Not share false, misleading, or harmful content</li>
                <li>Respect the privacy and boundaries of other users</li>
                <li>Report inappropriate behavior to our support team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Prohibited Conduct</h2>
              <p>The following activities are strictly prohibited:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Sharing explicit content involving minors</li>
                <li>Harassment, stalking, or threatening behavior</li>
                <li>Spam, scams, or fraudulent activities</li>
                <li>Impersonation of other users or entities</li>
                <li>Sharing personal information of other users</li>
                <li>Any illegal activities or content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Account Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account at any time, with or without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Privacy and Safety</h2>
              <p>
                Your privacy and safety are important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. Always prioritize your safety when meeting people online or in person.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
              <p>
                SLTR DIGITAL LLC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Governing Law</h2>
              <p>
                These Terms of Service shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="glass-bubble p-4 mt-4">
                <p><strong>Email:</strong> legal@getsltr.com</p>
                <p><strong>Company:</strong> SLTR DIGITAL LLC</p>
              </div>
            </section>
          </div>

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
