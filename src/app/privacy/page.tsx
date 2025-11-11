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
      <div className="pt-20 p-4 max-w-4xl mx-auto pb-20">
        <div className="glass-bubble p-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-white/60">Last updated: January 2025</p>
            <p className="text-white/60 text-sm mt-2">Effective Date: January 1, 2025</p>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">📋 Quick Summary</h3>
            <p className="text-white/80 text-sm">
              SLTR is a location-based dating platform for the LGBTQ+ community. We collect information you provide (profile, messages, location) to connect you with nearby users. We never sell your data. You can access, correct, or delete your information anytime. This policy explains our practices in detail.
            </p>
          </div>

          <div className="space-y-8 text-white/80">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.1 Information You Provide</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Account Registration:</strong> Email address, date of birth, display name, password, phone number (if provided)</li>
                <li><strong>Profile Information:</strong> Photos, bio, physical attributes, gender identity, sexual orientation, relationship preferences, interests, pronouns</li>
                <li><strong>Optional Profile Data:</strong> Body type, ethnicity, HIV status, PrEP usage, party preferences (party_friendly), hosting status, DTFN (Down To F*** Now) status</li>
                <li><strong>Verification Data:</strong> Government-issued ID photos (processed and immediately deleted after verification)</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store full payment card numbers)</li>
                <li><strong>Communications:</strong> Messages sent through our platform, customer support inquiries, feedback submissions</li>
                <li><strong>User-Generated Content:</strong> Photos, videos, voice recordings, written content you upload or share</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.2 Information Collected Automatically</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Location Data:</strong> Precise geolocation (GPS coordinates) when you enable location services, approximate location from IP address</li>
                <li><strong>Device Information:</strong> Device type, operating system, browser type, unique device identifiers, mobile network information</li>
                <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on platform, search queries, interaction patterns, taps/swipes, filters applied</li>
                <li><strong>Log Data:</strong> IP address, access times, hardware and software information, crash reports, API calls</li>
                <li><strong>Cookies & Similar Technologies:</strong> Session cookies, persistent cookies, web beacons, local storage (see Cookie Policy)</li>
                <li><strong>Communication Metadata:</strong> Message timestamps, read receipts, typing indicators (not message content for encryption)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.3 Information from Third Parties</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Social Media:</strong> Profile information from linked accounts (if you choose to connect social media)</li>
                <li><strong>Analytics Providers:</strong> Aggregated usage statistics from Sentry, Vercel Analytics</li>
                <li><strong>Payment Processors:</strong> Transaction confirmation data from Stripe</li>
                <li><strong>Other Users:</strong> Information contained in reports or abuse flagging</li>
                <li><strong>Public Sources:</strong> Publicly available information to verify identity or prevent fraud</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We process your personal information for the following purposes, based on the legal grounds indicated:</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 To Provide Our Services (Contract Performance)</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Create and manage your account</li>
                <li>Display your profile to other users based on matching criteria and proximity</li>
                <li>Enable real-time messaging, voice, and video calls</li>
                <li>Show you nearby users based on location preferences</li>
                <li>Generate user density heatmaps and display LGBTQ+ venue information</li>
                <li>Process transactions and manage subscriptions</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send service-related notifications (new matches, messages, etc.)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 For Safety & Security (Legitimate Interest)</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Detect, prevent, and investigate fraud, abuse, and violations of our Terms</li>
                <li>Verify user identity and age compliance (18+)</li>
                <li>Monitor for suspicious activity, spam, and automated bots</li>
                <li>Respond to reports of harassment, spam, or inappropriate content</li>
                <li>Maintain platform integrity and enforce Community Guidelines</li>
                <li>Comply with legal obligations and law enforcement requests</li>
                <li>Use EROS AI to analyze compatibility and safety signals</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 To Improve Our Platform (Legitimate Interest)</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Analyze usage patterns to optimize features and user experience</li>
                <li>Conduct research and development for new features</li>
                <li>Test and improve matching algorithms and AI models</li>
                <li>Perform internal analytics and troubleshooting</li>
                <li>Generate aggregated, de-identified statistics</li>
                <li>A/B test features and user interface improvements</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.4 Marketing & Communications (Consent or Legitimate Interest)</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Send transactional emails (account confirmations, password resets, receipts)</li>
                <li>Notify you about new matches, messages, and platform activity</li>
                <li>Share product updates, new features, and community news (opt-out available)</li>
                <li>Conduct surveys and request feedback</li>
                <li>Personalize your experience based on preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.5 Legal Compliance (Legal Obligation)</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Comply with applicable laws, regulations, and legal processes</li>
                <li>Respond to valid subpoenas and court orders</li>
                <li>Protect rights, property, and safety of SLTR, our users, and the public</li>
                <li>Enforce our Terms of Service and policies</li>
                <li>Maintain records required by law</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Information Sharing & Disclosure</h2>
              <p className="mb-4"><strong>We do not sell your personal information.</strong> We may share your information in the following circumstances:</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 With Other Users</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Your public profile (photos, bio, preferences) is visible to other users within your radius</li>
                <li>Approximate distance from other users (not exact location)</li>
                <li>Online status, last active time (unless you enable incognito mode)</li>
                <li>Messages, photos, and videos you send to other users</li>
                <li>Profile attributes you choose to display (age, position, party_friendly, DTFN, HIV status, etc.)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Service Providers</h3>
              <p className="mb-2">We share information with trusted third-party vendors who help us operate our platform:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Supabase:</strong> Database hosting, authentication, file storage, real-time features</li>
                <li><strong>Vercel:</strong> Application hosting, content delivery network (CDN)</li>
                <li><strong>Stripe:</strong> Payment processing (they handle payment card data under PCI-DSS compliance)</li>
                <li><strong>Daily.co:</strong> Video and voice call infrastructure (WebRTC)</li>
                <li><strong>Resend:</strong> Transactional email delivery</li>
                <li><strong>Sentry:</strong> Error monitoring and performance analytics</li>
                <li><strong>Foursquare:</strong> Venue data for LGBTQ+ location features</li>
                <li><strong>Mapbox:</strong> Map visualization and geolocation services</li>
                <li><strong>Anthropic/OpenAI:</strong> AI-powered features (EROS compatibility analysis)</li>
              </ul>
              <p className="mt-2 text-sm">All service providers are contractually obligated to protect your data and use it only as directed by us.</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.3 Legal Requirements & Safety</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>To comply with valid legal process (subpoenas, court orders, search warrants)</li>
                <li>To enforce our Terms of Service and policies</li>
                <li>To protect the rights, property, or safety of SLTR, our users, or the public</li>
                <li>To investigate and prevent fraud, security issues, or technical problems</li>
                <li>To cooperate with law enforcement in matters of public safety or illegal activity</li>
                <li>In response to reports of child exploitation (NCMEC reporting)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.4 Business Transfers</h3>
              <p>If SLTR is involved in a merger, acquisition, bankruptcy, reorganization, or sale of assets, your information may be transferred as part of that transaction. We will notify you via email and/or prominent notice on our platform at least 30 days before your information becomes subject to a different privacy policy.</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.5 With Your Consent</h3>
              <p>We may share your information for other purposes with your explicit consent, such as connecting your account to third-party services, participating in research studies, or public testimonials.</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.6 Aggregated & De-Identified Data</h3>
              <p>We may share aggregated, de-identified data that cannot reasonably be used to identify you (e.g., "80% of users in Los Angeles use the map feature") for analytics, research, marketing, or partnership purposes.</p>
            </section>

            {/* Section 4 - Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p className="mb-4">
                We implement robust technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Encryption:</strong> Data in transit is protected using TLS 1.3+ encryption; data at rest is encrypted using AES-256</li>
                <li><strong>Access Controls:</strong> Role-based access control (RBAC), Row Level Security (RLS) in database</li>
                <li><strong>Authentication:</strong> Secure password hashing (bcrypt), JWT token rotation, session management</li>
                <li><strong>Infrastructure:</strong> Hosted on Vercel with WAF, DDoS protection, automated backups</li>
                <li><strong>Monitoring:</strong> Real-time alerts for suspicious activity, automated threat detection</li>
                <li><strong>Audits:</strong> Regular security assessments and penetration testing</li>
                <li><strong>Incident Response:</strong> 24/7 security monitoring with documented response procedures</li>
              </ul>
              <p className="mt-4 text-sm">
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information using industry-standard practices, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Section 5 - Location Data */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Location Data & Privacy Controls</h2>
              <p className="mb-4">Location is core to our service. Here's how we handle it:</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Location Collection</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>We collect your precise GPS coordinates when you grant location permissions</li>
                <li>Location is updated when you open the app or move significantly</li>
                <li>If location access is denied, we use approximate location from your IP address</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 How Location is Used</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Show you nearby users within your selected radius (1-100 miles)</li>
                <li>Display approximate distance to other users (e.g., "0.5 mi away")</li>
                <li>Generate user density heatmaps on the map view</li>
                <li>Show nearby LGBTQ+ venues (bars, clubs, saunas)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 Location Privacy Protections</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>No Exact Location Sharing:</strong> Other users only see approximate distance, never your exact coordinates</li>
                <li><strong>Manual Relocation:</strong> You can manually set your location anywhere in the world</li>
                <li><strong>Incognito Mode:</strong> Hide your online status and last active time</li>
                <li><strong>Revoke Anytime:</strong> You can disable location services in your device/browser settings</li>
                <li><strong>Cluster Markers:</strong> On the map, nearby users may be grouped to further obscure precise locations</li>
              </ul>
            </section>

            {/* Section 6 - Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
              <p className="mb-4">Depending on your location, you may have the following rights:</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1 General Rights (All Users)</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Object:</strong> Object to certain processing of your data</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 California Residents (CCPA/CPRA)</h3>
              <p className="mb-2">If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Right to Know:</strong> Request details about the personal information we collect, use, disclose, and sell</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information (subject to exceptions)</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the "sale" or "sharing" of personal information (we don't sell data)</li>
                <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
                <li><strong>Right to Limit:</strong> Limit use of sensitive personal information</li>
                <li><strong>Non-Discrimination:</strong> We won't discriminate against you for exercising your rights</li>
              </ul>
              <p className="mt-2 text-sm">
                <strong>Sensitive Personal Information:</strong> We collect sensitive personal information including precise geolocation, sexual orientation, and contents of communications. This information is used only to provide our services and for safety purposes.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.3 European Union Residents (GDPR)</h3>
              <p className="mb-2">If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have rights under the General Data Protection Regulation (GDPR):</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Right of Access:</strong> Obtain confirmation of whether we process your data and access to it</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete personal data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
                <li><strong>Right to Restrict Processing:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing at any time</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority</li>
              </ul>
              <p className="mt-4"><strong>Legal Basis for Processing (GDPR):</strong> We process your data based on: (a) your consent, (b) performance of our contract with you, (c) our legitimate interests, (d) compliance with legal obligations.</p>
              <p className="mt-2"><strong>International Data Transfers:</strong> We may transfer your data outside the EEA to countries that may not offer the same level of data protection. When we do, we rely on approved transfer mechanisms such as Standard Contractual Clauses (SCCs).</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.4 How to Exercise Your Rights</h3>
              <p className="mb-2">To exercise any of these rights, contact us at:</p>
              <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                <p><strong>Email:</strong> privacy@getsltr.com</p>
                <p><strong>Subject Line:</strong> "Privacy Rights Request - [Your Right]"</p>
                <p className="mt-2 text-sm">We will respond within 30 days (45 days for GDPR requests). You may designate an authorized agent to make requests on your behalf.</p>
              </div>
            </section>

            {/* Section 7 - Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies & Tracking Technologies</h2>
              <p className="mb-4">We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. See our <Link href="/cookies" className="text-cyan-400 hover:text-cyan-300 underline">Cookie Policy</Link> for details.</p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.1 Types of Cookies We Use</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
                <li><strong>Performance Cookies:</strong> Analyze how you use our platform (Google Analytics, Vercel Analytics)</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences (language, radius, filters)</li>
                <li><strong>Analytics Cookies:</strong> Track usage patterns to improve our services</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.2 Managing Cookies</h3>
              <p>You can control cookies through your browser settings. Note that disabling cookies may affect platform functionality. Most browsers allow you to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>View and delete cookies</li>
                <li>Block third-party cookies</li>
                <li>Block all cookies (may break site functionality)</li>
                <li>Clear cookies when you close your browser</li>
              </ul>
            </section>

            {/* Section 8 - Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
              <p className="mb-4">We retain your information for as long as necessary to provide our services and comply with legal obligations:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Active Accounts:</strong> Profile data retained while your account is active</li>
                <li><strong>Deleted Accounts:</strong> Most personal data deleted within 90 days; some data retained for legal compliance (e.g., transaction records for 7 years)</li>
                <li><strong>Messages:</strong> Stored until you or the recipient deletes them; may be cached for up to 30 days after deletion</li>
                <li><strong>Location History:</strong> Precise location data not stored; only current location maintained</li>
                <li><strong>Log Data:</strong> Retained for 90 days for security and debugging purposes</li>
                <li><strong>Backup Data:</strong> May persist in encrypted backups for up to 90 days after deletion</li>
                <li><strong>Legal Holds:</strong> Data may be retained longer if required by law or ongoing legal matters</li>
              </ul>
            </section>

            {/* Section 9 - Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy (COPPA Compliance)</h2>
              <p className="mb-4">
                SLTR is strictly for users 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If you are under 18, do not use this service or provide any information to us.
              </p>
              <p>
                If we learn that we have collected personal information from a person under 18, we will immediately delete that information and terminate the account. If you believe we may have information from someone under 18, please contact us immediately at privacy@getsltr.com.
              </p>
            </section>

            {/* Section 10 - Third-Party Links */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Services & Links</h2>
              <p className="mb-4">
                Our platform may contain links to third-party websites, services, or integrations (e.g., social media, external venue pages). We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies before providing any information.
              </p>
              <p>
                When you interact with third-party services through our platform (e.g., sharing to social media), those services may collect information about you according to their own privacy policies.
              </p>
            </section>

            {/* Section 11 - Automated Decision-Making */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Automated Decision-Making & Profiling</h2>
              <p className="mb-4">
                We use automated systems and AI (including our EROS feature) to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Suggest compatible matches based on your preferences and behavior</li>
                <li>Detect and prevent spam, fraud, and abusive behavior</li>
                <li>Analyze compatibility between users</li>
                <li>Personalize your experience and content recommendations</li>
              </ul>
              <p className="mt-4">
                These automated decisions do not have legal or similarly significant effects. You can opt out of certain AI features in your settings. If you have concerns about automated processing, contact privacy@getsltr.com.
              </p>
            </section>

            {/* Section 12 - Changes to This Policy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Posting the new Privacy Policy on this page with an updated "Last updated" date</li>
                <li>Sending you an email notification (for significant changes)</li>
                <li>Displaying a prominent notice on our platform</li>
              </ul>
              <p className="mt-4">
                Material changes will take effect 30 days after notification. Your continued use of SLTR after the effective date constitutes acceptance of the updated policy. If you disagree with changes, you may delete your account.
              </p>
            </section>

            {/* Section 13 - Contact Us */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
              <p className="mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="glass-bubble p-6 bg-white/5 border border-white/10 space-y-3">
                <p><strong>Email:</strong> privacy@getsltr.com</p>
                <p><strong>Security Issues:</strong> security@getsltr.com</p>
                <p><strong>Company:</strong> SLTR DIGITAL LLC</p>
                <p><strong>Mailing Address:</strong><br />
                  SLTR DIGITAL LLC<br />
                  Attn: Privacy Officer<br />
                  Los Angeles, CA 90001<br />
                  United States
                </p>
                <p className="text-sm mt-4"><strong>EU Representative:</strong> If you are in the EU and have concerns, you may contact your local data protection authority.</p>
                <p className="text-sm"><strong>Response Time:</strong> We aim to respond to all inquiries within 30 days (45 days for GDPR requests).</p>
              </div>
            </section>

            {/* Section 14 - Additional Resources */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Related Policies</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/terms" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Terms of Service</h3>
                  <p className="text-sm text-white/70">Rules and agreements for using SLTR</p>
                </Link>
                <Link href="/cookies" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Cookie Policy</h3>
                  <p className="text-sm text-white/70">How we use cookies and tracking technologies</p>
                </Link>
                <Link href="/guidelines" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Community Guidelines</h3>
                  <p className="text-sm text-white/70">Standards for respectful behavior</p>
                </Link>
                <Link href="/security" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Security & Trust</h3>
                  <p className="text-sm text-white/70">How we protect your data</p>
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
