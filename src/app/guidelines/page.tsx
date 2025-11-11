'use client'

import Link from 'next/link'

export default function GuidelinesPage() {
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
          <h1 className="text-2xl font-bold gradient-text">Community Guidelines</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-4 max-w-4xl mx-auto pb-20">
        <div className="glass-bubble p-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Community Guidelines</h1>
            <p className="text-white/60">Last updated: January 2025</p>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">💙 Our Mission</h3>
            <p className="text-white/80">
              SLTR is a safe, inclusive space for the LGBTQ+ community to connect authentically. These guidelines ensure everyone can explore, express themselves, and form meaningful connections without fear of harassment or discrimination.
            </p>
          </div>

          <div className="space-y-8 text-white/80">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Core Principles</h2>
              <p className="mb-4">SLTR is built on four foundational principles:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">🤝 Respect</h3>
                  <p className="text-sm">Treat everyone with kindness and dignity, regardless of identity, expression, or preferences.</p>
                </div>
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">💬 Consent</h3>
                  <p className="text-sm">All interactions must be consensual. "No" means no. Respect boundaries always.</p>
                </div>
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">🌈 Inclusivity</h3>
                  <p className="text-sm">We celebrate diversity. Homophobia, transphobia, and discrimination have no place here.</p>
                </div>
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">🔒 Safety</h3>
                  <p className="text-sm">Your safety is paramount. Report concerning behavior, and we'll investigate immediately.</p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Age Requirement</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <p className="font-bold text-red-400 mb-3">🔞 SLTR is strictly 18+ only.</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>All users must be at least 18 years old</li>
                  <li>We verify age during signup and may request additional verification</li>
                  <li>Any user found to be underage will be immediately and permanently banned</li>
                  <li>Engaging with minors on our platform is illegal and will be reported to authorities</li>
                  <li>If you suspect a user is underage, report them immediately</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Respect & Consent</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Consensual Interactions</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Obtain consent before sending explicit photos, videos, or messages</li>
                <li>Respect when someone says "no" or sets a boundary</li>
                <li>Do not pressure, coerce, or manipulate others into unwanted interactions</li>
                <li>Understand that consent can be withdrawn at any time</li>
                <li>Do not share intimate content received in confidence without explicit permission</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Zero Tolerance for Harassment</h3>
              <p className="mb-2">The following behaviors result in immediate account suspension:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Harassment:</strong> Repeatedly contacting someone who has asked you to stop, blocked you, or expressed disinterest</li>
                <li><strong>Stalking:</strong> Tracking someone's location, creating multiple accounts to contact them, or attempting to find them off-platform</li>
                <li><strong>Threatening:</strong> Making threats of violence, harm, blackmail, or doxxing</li>
                <li><strong>Bullying:</strong> Targeted, repeated attacks on someone's identity, appearance, or choices</li>
                <li><strong>Unsolicited Explicit Content:</strong> Sending sexual photos/videos without prior consent</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.3 Hate Speech & Discrimination</h3>
              <p className="mb-2">We have zero tolerance for content or behavior that attacks people based on:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Sexual orientation (homophobia, biphobia)</li>
                <li>Gender identity or expression (transphobia, enbyphobia)</li>
                <li>Race or ethnicity (racism, xenophobia)</li>
                <li>Religion or beliefs</li>
                <li>Disability or health status (including HIV status)</li>
                <li>Body type or appearance (body shaming, fatphobia)</li>
                <li>Age (ageism)</li>
              </ul>
              <p className="mt-4 text-sm italic">
                Note: Having personal dating preferences (e.g., preferred body types, ages, roles) is acceptable. Expressing those preferences in a disrespectful, demeaning, or discriminatory way is not.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Profile Guidelines</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Authentic Profiles</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Use real photos:</strong> Profile photos must be of you, not celebrities, friends, or AI-generated images</li>
                <li><strong>Recent photos:</strong> Photos should accurately represent your current appearance (within 2-3 years)</li>
                <li><strong>Face visibility:</strong> At least one photo should clearly show your face (privacy options like incognito mode are available)</li>
                <li><strong>No misleading information:</strong> Be honest about age, identity, and intentions</li>
                <li><strong>One account per person:</strong> Multiple accounts are prohibited without explicit permission</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Prohibited Profile Content</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Photos of minors (anyone under 18)</li>
                <li>Nudity or sexually explicit content in public profile photos (use private albums)</li>
                <li>Graphic violence, gore, or disturbing imagery</li>
                <li>Hate symbols, extremist imagery, or terrorist content</li>
                <li>Contact information for off-platform solicitation (phone numbers, social media handles)</li>
                <li>Spam, advertisements, or promotional material</li>
                <li>Copyrighted material you don't have rights to use</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 Bio & Text Guidelines</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Be respectful and avoid degrading language</li>
                <li>No slurs or hateful language (even in jest)</li>
                <li>No solicitation for prostitution, escort services, or sugar daddy/baby arrangements</li>
                <li>No drug sales or illegal activity</li>
                <li>Clearly state your intentions (dating, friends, hookups, etc.)</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Messaging & Communication</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Respectful Communication</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Start conversations respectfully; crude opening messages are discouraged</li>
                <li>Accept rejection gracefully; move on if someone isn't interested</li>
                <li>Do not spam users with repeated messages</li>
                <li>Respect people's stated preferences and boundaries</li>
                <li>Use block and report features for unwanted contact</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Explicit Content in Messages</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Do not send explicit photos/videos without consent</li>
                <li>Gauge interest before transitioning to sexual topics</li>
                <li>Respect NSFW content boundaries (vanilla mode users, minors)</li>
                <li>Do not share intimate content received from others without permission</li>
                <li>Revenge porn (sharing intimate images without consent) is illegal and will be reported to authorities</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 Voice & Video Calls</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Obtain consent before initiating voice/video calls</li>
                <li>Do not record calls without explicit permission from all participants</li>
                <li>No nudity or sexual acts on video calls without mutual consent</li>
                <li>Respect privacy; do not screenshot or share call content without permission</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Safety Guidelines</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1 Meeting in Person</h3>
              <p className="mb-2">If you choose to meet someone from SLTR, please prioritize your safety:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Meet in public places for first dates (coffee shops, restaurants, bars)</li>
                <li>Tell a friend or family member where you're going and who you're meeting</li>
                <li>Share your location with a trusted contact</li>
                <li>Arrange your own transportation; don't rely on your date for rides</li>
                <li>Trust your instincts; leave if you feel uncomfortable</li>
                <li>Do not share your home address until you've built trust</li>
                <li>Stay sober enough to make clear decisions</li>
                <li>Practice safe sex and discuss boundaries beforehand</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 Financial Safety</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Never send money to someone you've only met on SLTR</li>
                <li>Be wary of sob stories, emergency requests, or investment opportunities</li>
                <li>Do not share banking information, credit card details, or social security numbers</li>
                <li>Report users who solicit money or engage in financial scams</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.3 Health & Wellness</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Practice safe sex; discuss STI status and testing openly</li>
                <li>Respect people's HIV status disclosures and PrEP/treatment choices</li>
                <li>Do not shame or discriminate based on health status</li>
                <li>If using drugs or alcohol, do so responsibly and consensually</li>
                <li>Watch your drink; never leave it unattended</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Prohibited Activities</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.1 Illegal Content & Activities</h3>
              <p className="mb-2">The following are strictly prohibited and will result in immediate termination and legal action:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Child Sexual Abuse Material (CSAM):</strong> Any content involving minors in sexual or suggestive contexts</li>
                <li><strong>Revenge Porn:</strong> Sharing intimate images of someone without their consent</li>
                <li><strong>Human Trafficking:</strong> Recruiting, transporting, or exploiting people</li>
                <li><strong>Prostitution/Solicitation:</strong> Offering or soliciting sex for money (excluding legal sex work in jurisdictions where permitted)</li>
                <li><strong>Drug Trafficking:</strong> Selling, distributing, or facilitating illegal drug sales</li>
                <li><strong>Violence & Terrorism:</strong> Promoting, glorifying, or planning violence or terrorist acts</li>
                <li><strong>Fraud & Scams:</strong> Catfishing, financial scams, identity theft</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.2 Platform Abuse</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Spam:</strong> Sending bulk messages, advertisements, or promotional content</li>
                <li><strong>Bots & Automation:</strong> Using automated scripts, bots, or tools to interact with users</li>
                <li><strong>Account Farming:</strong> Creating multiple accounts to circumvent bans or manipulate the platform</li>
                <li><strong>Scraping:</strong> Harvesting user data, photos, or information for external use</li>
                <li><strong>Hacking:</strong> Attempting to access other users' accounts or platform systems</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.3 Commercial Activity</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>No advertising or promoting businesses, products, or services</li>
                <li>No MLM (multi-level marketing) or pyramid scheme recruitment</li>
                <li>No soliciting for OnlyFans, Patreon, or paid content platforms</li>
                <li>Exception: LGBTQ+ venues, events, or community resources may be shared in appropriate contexts</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Reporting & Enforcement</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.1 How to Report</h3>
              <p className="mb-2">If you witness or experience a violation of these guidelines:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Use the in-app <strong>Report</strong> button on any profile, message, or content</li>
                <li>Use the <strong>Block</strong> feature to immediately stop all contact with a user</li>
                <li>Contact <strong>support@getsltr.com</strong> for urgent safety concerns</li>
                <li>For illegal activity (threats, CSAM, trafficking), contact local law enforcement and then notify us</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.2 What Happens After You Report</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Our moderation team reviews all reports within 24-48 hours</li>
                <li>Serious violations (violence, CSAM, harassment) are escalated immediately</li>
                <li>We may request additional information from you</li>
                <li>The reported user may be warned, suspended, or permanently banned</li>
                <li>You will be notified of the outcome (when appropriate)</li>
                <li>All reports are confidential; the reported user will not know who reported them</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.3 Consequences for Violations</h3>
              <p className="mb-2">Depending on the severity and frequency of violations, we may:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Warning:</strong> First-time minor violations may receive a written warning</li>
                <li><strong>Content Removal:</strong> Violating photos, messages, or bio content will be removed</li>
                <li><strong>Feature Restrictions:</strong> Temporary restrictions on messaging, profile visibility, or other features</li>
                <li><strong>Temporary Suspension:</strong> 7-30 day account suspension for moderate violations</li>
                <li><strong>Permanent Ban:</strong> Immediate termination for serious violations (violence, CSAM, harassment)</li>
                <li><strong>Legal Action:</strong> Reporting to law enforcement for illegal activities</li>
                <li><strong>Device Ban:</strong> Preventing account creation from your device</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">8.4 Appeals</h3>
              <p className="mb-2">If you believe your account was suspended or banned in error:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Email <strong>legal@getsltr.com</strong> with your username and a detailed explanation</li>
                <li>Appeals are reviewed within 7 business days</li>
                <li>Decisions on permanent bans for serious violations (violence, CSAM, harassment) are final</li>
                <li>False or frivolous appeals may result in additional penalties</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">9. LGBTQ+ Safe Space Commitment</h2>
              <p className="mb-4">
                SLTR is proudly a platform for the LGBTQ+ community. We are committed to maintaining a safe, inclusive environment where:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>All gender identities are respected (trans, non-binary, genderqueer, genderfluid, etc.)</li>
                <li>All sexual orientations are welcomed (gay, lesbian, bisexual, pansexual, asexual, queer, etc.)</li>
                <li>People can express themselves authentically without fear of judgment</li>
                <li>Pronouns are honored, and misgendering is taken seriously</li>
                <li>HIV-positive individuals are not stigmatized or discriminated against</li>
                <li>Kink, polyamory, and diverse relationship structures are accepted</li>
                <li>LGBTQ+-specific health and safety resources are prioritized</li>
              </ul>
              <p className="mt-4 font-semibold text-cyan-400">
                Homophobia, transphobia, and discrimination of any kind will not be tolerated. This is our space, and we protect it fiercely.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Additional Resources</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">🆘 Crisis Support</h3>
                  <ul className="text-sm space-y-1">
                    <li><strong>Trevor Project:</strong> 1-866-488-7386</li>
                    <li><strong>Trans Lifeline:</strong> 1-877-565-8860</li>
                    <li><strong>National Suicide Prevention:</strong> 988</li>
                    <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                  </ul>
                </div>
                <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">💊 Health Resources</h3>
                  <ul className="text-sm space-y-1">
                    <li><strong>PrEP Info:</strong> preplocator.org</li>
                    <li><strong>HIV Testing:</strong> gettested.cdc.gov</li>
                    <li><strong>STI Resources:</strong> stdcheck.com</li>
                    <li><strong>Planned Parenthood:</strong> 1-800-230-7526</li>
                  </ul>
                </div>
              </div>

              <div className="glass-bubble p-5 bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">📧 Contact SLTR Team</h3>
                <ul className="space-y-1">
                  <li><strong>General Support:</strong> support@getsltr.com</li>
                  <li><strong>Safety & Trust:</strong> safety@getsltr.com</li>
                  <li><strong>Report Abuse:</strong> abuse@getsltr.com</li>
                  <li><strong>Legal Matters:</strong> legal@getsltr.com</li>
                </ul>
              </div>
            </section>

            {/* Related Policies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Related Policies</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/terms" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Terms of Service</h3>
                  <p className="text-sm text-white/70">Legal agreement for using SLTR</p>
                </Link>
                <Link href="/privacy" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Privacy Policy</h3>
                  <p className="text-sm text-white/70">How we protect your data</p>
                </Link>
                <Link href="/security" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Security & Trust</h3>
                  <p className="text-sm text-white/70">Our security measures</p>
                </Link>
                <Link href="/cookies" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Cookie Policy</h3>
                  <p className="text-sm text-white/70">How we use cookies</p>
                </Link>
              </div>
            </section>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-white/10">
            <p className="text-white/60 text-sm mb-6">
              These guidelines are living documents and may be updated as our community grows. Thank you for helping make SLTR a safe, welcoming space for everyone.
            </p>
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
