'use client'

import Link from 'next/link'

export default function CookiePolicyPage() {
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
          <h1 className="text-2xl font-bold gradient-text">Cookie Policy</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-4 max-w-4xl mx-auto pb-20">
        <div className="glass-bubble p-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Cookie Policy</h1>
            <p className="text-white/60">Last updated: January 2025</p>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">🍪 What Are Cookies?</h3>
            <p className="text-white/80 text-sm">
              Cookies are small text files stored on your device when you visit websites. They help us remember your preferences, keep you logged in, and improve your experience on SLTR.
            </p>
          </div>

          <div className="space-y-8 text-white/80">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.1 Essential Cookies (Required)</h3>
              <p className="mb-4">These cookies are necessary for the platform to function and cannot be disabled:</p>
              <div className="glass-bubble p-5 bg-white/5 border border-white/10 space-y-2">
                <p><strong>Authentication Cookies:</strong> Keep you logged in and maintain your session</p>
                <p><strong>Security Cookies:</strong> Protect against CSRF attacks and maintain platform security</p>
                <p><strong>Load Balancing:</strong> Distribute traffic evenly across servers</p>
                <p><strong>Cookie Consent:</strong> Remember your cookie preferences</p>
              </div>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.2 Functional Cookies (Enhance Experience)</h3>
              <p className="mb-4">These cookies remember your preferences and settings:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Language Preference:</strong> Remember your selected language (sltr_preferred_language)</li>
                <li><strong>Notification Settings:</strong> Remember sound and vibration preferences (sltr_notify_sound, sltr_notify_vibrate)</li>
                <li><strong>Map Settings:</strong> Remember radius, filters, and map style preferences</li>
                <li><strong>Theme Preferences:</strong> Dark mode, vanilla mode selections</li>
                <li><strong>Location Consent:</strong> Remember if you've granted location permissions</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.3 Analytics Cookies (Performance & Improvement)</h3>
              <p className="mb-4">These cookies help us understand how you use SLTR so we can improve:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Performance Monitoring:</strong> Track page views, load times, and performance metrics</li>
                <li><strong>Error Detection:</strong> Monitor errors and crashes to improve stability</li>
                <li><strong>Usage Analytics:</strong> Track which features are most used, user flows, and engagement patterns</li>
              </ul>
              <p className="mt-2 text-sm italic">These cookies collect aggregated, anonymized data and do not identify you personally.</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.4 Marketing Cookies (Optional)</h3>
              <p className="mb-2">We may use these cookies for targeted advertising (requires consent):</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Ad Tracking:</strong> Measure effectiveness of ad campaigns</li>
                <li><strong>Retargeting:</strong> Show relevant ads to users who visited SLTR</li>
                <li><strong>Social Media:</strong> Track conversions from social media ads</li>
              </ul>
              <p className="mt-2 text-sm">You can opt out of marketing cookies at any time.</p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Cookies</h2>
              <p className="mb-4">We use cookies and similar technologies for the following purposes:</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">🔐 Authentication & Security</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Keep you logged in</li>
                    <li>• Verify your identity</li>
                    <li>• Prevent unauthorized access</li>
                    <li>• Detect suspicious activity</li>
                  </ul>
                </div>
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">⚙️ Functionality</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Remember preferences</li>
                    <li>• Save map filters and settings</li>
                    <li>• Maintain language selection</li>
                    <li>• Store notification preferences</li>
                  </ul>
                </div>
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">📊 Analytics & Performance</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Analyze usage patterns</li>
                    <li>• Track page load times</li>
                    <li>• Identify bugs and errors</li>
                    <li>• Optimize user experience</li>
                  </ul>
                </div>
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">📈 Marketing & Advertising</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Measure ad effectiveness</li>
                    <li>• Personalize ad content</li>
                    <li>• Retarget previous visitors</li>
                    <li>• Track conversions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Third-Party Cookies</h2>
              <p className="mb-4">
                SLTR uses top-tier, industry-certified service providers to deliver secure and reliable experiences. These providers may set cookies according to their own privacy policies:
              </p>

              <div className="space-y-4">
                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Performance Analytics</h3>
                  <p className="text-sm mb-2">Enterprise-grade monitoring for page views, performance metrics, and Web Vitals to ensure optimal experience</p>
                </div>

                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Error Monitoring</h3>
                  <p className="text-sm mb-2">Industry-leading error detection and performance tracking to maintain platform stability</p>
                </div>

                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Payment Processing</h3>
                  <p className="text-sm mb-2">PCI-DSS certified payment processors set secure cookies during checkout to protect your transactions</p>
                </div>

                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Location Services</h3>
                  <p className="text-sm mb-2">Trusted geolocation and mapping providers for accurate location-based features</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/60">
                We partner with top-tier, industrial-level certified providers to ensure your security and privacy are our top priority. All third-party services align with current industry standards and best practices.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Local Storage & Session Storage</h2>
              <p className="mb-4">
                In addition to cookies, we use Local Storage and Session Storage (similar technologies) to store data locally on your device:
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Local Storage</h3>
              <p className="mb-2">Persists until manually cleared. We store:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Language preferences (sltr_preferred_language)</li>
                <li>Notification settings (sltr_notify_sound, sltr_notify_vibrate)</li>
                <li>Map preferences (radius, filters, style)</li>
                <li>Welcome modal dismissal status</li>
                <li>Feature discovery flags</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Session Storage</h3>
              <p className="mb-2">Clears when you close your browser tab. We store:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Temporary form data to prevent data loss</li>
                <li>Current session state</li>
                <li>Navigation history within the app</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Managing Cookies</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Browser Settings</h3>
              <p className="mb-4">You can control and delete cookies through your browser settings:</p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Chrome</h4>
                  <p className="text-sm">Settings → Privacy and security → Cookies and other site data</p>
                </div>
                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Firefox</h4>
                  <p className="text-sm">Settings → Privacy & Security → Cookies and Site Data</p>
                </div>
                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Safari</h4>
                  <p className="text-sm">Preferences → Privacy → Manage Website Data</p>
                </div>
                <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Edge</h4>
                  <p className="text-sm">Settings → Cookies and site permissions → Manage cookies</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Cookie Options</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Accept All Cookies:</strong> Allows all cookies for full functionality and personalization</li>
                <li><strong>Reject Non-Essential:</strong> Only essential cookies are set; features may be limited</li>
                <li><strong>Customize:</strong> Choose which categories of cookies to accept</li>
                <li><strong>Clear Cookies:</strong> Delete all cookies (you'll be logged out and preferences reset)</li>
              </ul>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mt-6">
                <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Impact of Disabling Cookies</h4>
                <p className="text-sm">
                  Blocking or deleting cookies may affect your experience on SLTR. You may be logged out repeatedly, preferences won't be saved, and some features may not work properly.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Do Not Track (DNT)</h2>
              <p className="mb-4">
                Some browsers offer a "Do Not Track" (DNT) signal. However, there is no industry consensus on how to respond to DNT signals. We currently do not respond to DNT signals, but we respect your privacy choices through our cookie preferences.
              </p>
              <p>
                You can opt out of analytics and marketing cookies without enabling DNT by adjusting your cookie preferences in the banner when you first visit SLTR.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookie Lifespan</h2>
              <p className="mb-4">Cookies are stored for different durations depending on their purpose:</p>

              <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4">Cookie Type</th>
                      <th className="text-left py-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b border-white/5">
                      <td className="py-2 pr-4">Session Cookies</td>
                      <td className="py-2">Deleted when browser closes</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 pr-4">Authentication</td>
                      <td className="py-2">30 days (or logout)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 pr-4">Preferences</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 pr-4">Analytics</td>
                      <td className="py-2">1-2 years</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Marketing</td>
                      <td className="py-2">90 days - 1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Updates to This Policy</h2>
              <p className="mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. Material changes will be communicated by:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Updating the "Last updated" date at the top of this page</li>
                <li>Displaying a notice when you visit SLTR</li>
                <li>Sending an email notification for significant changes</li>
              </ul>
              <p className="mt-4">
                We encourage you to review this policy periodically to stay informed about how we use cookies.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Contact Us</h2>
              <p className="mb-4">
                If you have questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="glass-bubble p-6 bg-white/5 border border-white/10 space-y-2">
                <p><strong>Email:</strong> privacy@getsltr.com</p>
                <p><strong>Company:</strong> SLTR DIGITAL LLC</p>
                <p><strong>Mailing Address:</strong><br />
                  SLTR DIGITAL LLC<br />
                  Attn: Privacy Officer<br />
                  Los Angeles, CA 90001<br />
                  United States
                </p>
              </div>
            </section>

            {/* Related Policies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Related Policies</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/privacy" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Privacy Policy</h3>
                  <p className="text-sm text-white/70">How we collect and use your data</p>
                </Link>
                <Link href="/terms" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Terms of Service</h3>
                  <p className="text-sm text-white/70">Legal agreement for using SLTR</p>
                </Link>
                <Link href="/guidelines" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Community Guidelines</h3>
                  <p className="text-sm text-white/70">Standards for respectful behavior</p>
                </Link>
                <Link href="/security" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Security & Trust</h3>
                  <p className="text-sm text-white/70">How we protect your information</p>
                </Link>
              </div>
            </section>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-white/10">
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
