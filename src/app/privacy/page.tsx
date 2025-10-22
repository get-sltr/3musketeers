'use client'

import Link from 'next/link'

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold gradient-text">Privacy Policy</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-4 max-w-4xl mx-auto">
        <div className="glass-bubble p-8 space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-white/60">Last updated: January 2025</p>
          </div>

          <div className="space-y-6 text-white/80">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-4">
                <li>Account information (email, username, age)</li>
                <li>Profile information (photos, bio, preferences)</li>
                <li>Location data (with your permission)</li>
                <li>Messages and communications</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Show you relevant profiles and matches</li>
                <li>Enable messaging and communication features</li>
                <li>Ensure safety and prevent abuse</li>
                <li>Send you important updates about the service</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-4">
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>To prevent fraud or abuse</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Location Data</h2>
              <p>
                We collect location data to show you nearby users and calculate distances. You can control location sharing in your privacy settings. We never share your exact location with other users without your permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Opt out of certain communications</li>
                <li>Control your privacy settings</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. You can control cookie settings in your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we will delete your personal information, though some information may be retained for legal or safety reasons.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="glass-bubble p-4 mt-4">
                <p><strong>Email:</strong> privacy@getsltr.com</p>
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
