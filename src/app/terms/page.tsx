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
      <div className="pt-20 p-4 max-w-4xl mx-auto pb-20">
        <div className="glass-bubble p-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-white/60">Last updated: January 2025</p>
            <p className="text-white/60 text-sm mt-2">Effective Date: January 1, 2025</p>
          </div>

          <div className="bg-pink-500/10 border border-pink-500/30 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-pink-400 mb-2">⚠️ Important Notice</h3>
            <p className="text-white/80 text-sm">
              These Terms contain a mandatory arbitration clause (Section 16) and class action waiver. Please read carefully. By using SLTR, you agree to these Terms, including the arbitration agreement.
            </p>
          </div>

          <div className="space-y-8 text-white/80">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to SLTR ("the Platform," "we," "us," or "our"), a location-based social discovery platform for the LGBTQ+ community operated by SLTR DIGITAL LLC. These Terms of Service ("Terms") govern your access to and use of our website, mobile application, and related services (collectively, the "Service").
              </p>
              <p className="mb-4">
                By creating an account, accessing, or using the Service, you agree to be bound by these Terms and our <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</Link>. If you do not agree to these Terms, you may not use the Service.
              </p>
              <p className="mb-4">
                <strong>IMPORTANT:</strong> These Terms include a mandatory arbitration agreement and class action waiver in Section 16. This affects your legal rights. Please read it carefully.
              </p>
              <p>
                We reserve the right to update these Terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before the effective date. Continued use after changes constitutes acceptance.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility & Account Requirements</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Age Requirement</h3>
              <p className="mb-4">
                You must be at least <strong>18 years of age</strong> to create an account or use SLTR. By using the Service, you represent and warrant that:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>You are at least 18 years old</li>
                <li>You have the legal capacity to enter into a binding contract</li>
                <li>You are not prohibited from using the Service under applicable law</li>
                <li>You have never been convicted of a felony or indictable offense (or crime of similar severity), a sex crime, or any crime involving violence</li>
                <li>You are not required to register as a sex offender with any government entity</li>
              </ul>
              <p>
                We reserve the right to verify your age and identity at any time. Accounts found to be in violation of age requirements will be immediately terminated and reported to authorities if necessary.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Account Security</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to notify us immediately of any unauthorized access or security breach</li>
                <li>You are responsible for all activity that occurs under your account</li>
                <li>You may not transfer, sell, or share your account with any other person</li>
                <li>You may not create more than one account without our express permission</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Account Termination</h3>
              <p>
                You may delete your account at any time through your account settings. We may suspend or terminate your account immediately, with or without notice, for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                <li>Violation of these Terms or our Community Guidelines</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Harm or risk to other users, us, or third parties</li>
                <li>Any other reason at our sole discretion</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Conduct & Responsibilities</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Acceptable Use</h3>
              <p className="mb-2">As a user of SLTR, you agree to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Provide accurate, current, and complete information in your profile</li>
                <li>Respect other users and maintain appropriate, consensual conduct</li>
                <li>Comply with all applicable local, state, national, and international laws</li>
                <li>Use the Service only for its intended purpose (social discovery and dating)</li>
                <li>Obtain consent before sharing, recording, or distributing any content from conversations</li>
                <li>Report inappropriate behavior, harassment, or violations to our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Prohibited Conduct</h3>
              <p className="mb-2">The following activities are strictly prohibited and may result in immediate account termination and legal action:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong>Illegal Activity:</strong> Engaging in or promoting any illegal activities</li>
                <li><strong>Harassment & Abuse:</strong> Harassing, stalking, threatening, bullying, or intimidating other users</li>
                <li><strong>Hate Speech:</strong> Posting content that promotes discrimination, racism, sexism, homophobia, transphobia, or hatred</li>
                <li><strong>Sexual Exploitation:</strong> Sharing, requesting, or promoting child sexual abuse material (CSAM) or non-consensual intimate images</li>
                <li><strong>Fraud & Scams:</strong> Engaging in scams, phishing, solicitation, or financial fraud</li>
                <li><strong>Impersonation:</strong> Impersonating another person, entity, or creating fake profiles</li>
                <li><strong>Spam:</strong> Sending unsolicited bulk messages, advertisements, or promotional content</li>
                <li><strong>Privacy Violations:</strong> Sharing private information of others without consent (doxxing)</li>
                <li><strong>Prostitution:</strong> Offering, soliciting, or facilitating prostitution or commercial sex work</li>
                <li><strong>Drug Sales:</strong> Selling, distributing, or facilitating illegal drug transactions</li>
                <li><strong>Violent Content:</strong> Posting graphic violence, gore, or content glorifying violence</li>
                <li><strong>Bot Usage:</strong> Using automated systems, bots, or scripts to access the Service</li>
                <li><strong>Service Abuse:</strong> Attempting to circumvent security measures, access restrictions, or rate limits</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Content Ownership & Licensing</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Your Content</h3>
              <p className="mb-4">
                You retain ownership of all content you post, upload, or share on SLTR ("User Content"), including photos, videos, messages, bio text, and other materials. However, by posting User Content, you grant SLTR a worldwide, non-exclusive, royalty-free, transferable, sublicensable license to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>Use, reproduce, modify, adapt, publish, and display your User Content</li>
                <li>Create derivative works for the purpose of providing and improving the Service</li>
                <li>Distribute your User Content to other users as part of the Service functionality</li>
                <li>Use your User Content for marketing and promotional materials (with your consent)</li>
              </ul>
              <p className="mb-4">
                This license ends when you delete your User Content or account, except for content that has been shared with other users or is reasonably necessary for us to maintain (e.g., backup copies for 90 days, content required for legal compliance).
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Content Representations</h3>
              <p className="mb-2">You represent and warrant that:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>You own or have the necessary rights, licenses, and permissions to share all User Content</li>
                <li>Your User Content does not infringe any third-party intellectual property rights</li>
                <li>Your User Content complies with these Terms and applicable law</li>
                <li>You have obtained consent from anyone whose likeness appears in your User Content</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 Our Rights to Your Content</h3>
              <p className="mb-4">
                We reserve the right, but not the obligation, to monitor, review, edit, remove, or disable access to any User Content at any time, for any reason, without notice. This includes content that violates these Terms, our Community Guidelines, or applicable law.
              </p>
              <p>
                We do not endorse or guarantee the accuracy, quality, or appropriateness of User Content. Users are solely responsible for their content.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.4 Platform Content</h3>
              <p className="mb-4">
                All content, features, functionality, and intellectual property of the SLTR platform (excluding User Content) are owned by SLTR DIGITAL LLC and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>
                You may not copy, modify, distribute, sell, or create derivative works from our platform content without express written permission.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Subscriptions & Payments</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Paid Services</h3>
              <p className="mb-4">
                SLTR offers optional paid features and subscriptions ("Paid Services"), including but not limited to premium membership tiers, verification badges, and enhanced features. All prices are in USD unless otherwise stated.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Billing & Auto-Renewal</h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Subscriptions automatically renew at the end of each billing cycle (monthly, quarterly, or annually) unless canceled</li>
                <li>You will be charged the then-current price for the subscription tier you selected</li>
                <li>Payment is processed through secure third-party payment processors certified to PCI-DSS standards</li>
                <li>You authorize us to charge your payment method for all fees incurred</li>
                <li>Price changes will be communicated at least 30 days in advance</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 Cancellation & Refunds</h3>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>You may cancel your subscription at any time through your account settings</li>
                <li>Cancellation takes effect at the end of the current billing period; you retain access until then</li>
                <li>No refunds or credits for partial periods, unused features, or account terminations</li>
                <li>If we terminate your account for violation of these Terms, you forfeit all fees paid</li>
                <li>Refunds may be issued at our sole discretion for extenuating circumstances</li>
              </ul>
              <p className="text-sm">
                <strong>Right to Withdraw (EU/UK):</strong> If you are located in the EU or UK, you have the right to withdraw from a purchase within 14 days of subscription. However, by using Paid Services immediately, you waive this right.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.4 Taxes</h3>
              <p>
                You are responsible for all applicable taxes, fees, and charges imposed by any government authority. If we are required to collect taxes, we will add them to your invoice.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Privacy & Data Usage</h2>
              <p className="mb-4">
                Your use of SLTR is subject to our <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</Link>, which explains how we collect, use, and protect your personal information.
              </p>
              <p className="mb-4">
                By using the Service, you consent to our collection and use of your data as described in the Privacy Policy, including:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Collection of precise geolocation data (GPS coordinates)</li>
                <li>Use of cookies and tracking technologies</li>
                <li>Sharing data with third-party service providers</li>
                <li>Processing sensitive personal information (sexual orientation, health status, etc.)</li>
                <li>Use of AI/ML systems for matching, safety, and personalization</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Safety & Moderation</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.1 Content Moderation</h3>
              <p className="mb-4">
                We use a combination of automated systems, AI, and human moderators to enforce our Community Guidelines and Terms. We reserve the right to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Remove, hide, or flag content that violates our policies</li>
                <li>Issue warnings, temporary suspensions, or permanent bans</li>
                <li>Limit features or functionalities for problematic accounts</li>
                <li>Cooperate with law enforcement investigations</li>
                <li>Report illegal activity to authorities (e.g., CSAM to NCMEC)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.2 User Safety</h3>
              <p className="mb-2">While we implement safety measures, you acknowledge that:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>We cannot guarantee the accuracy of user profiles or verify all user identities</li>
                <li>You are responsible for your own safety when meeting users in person</li>
                <li>We recommend meeting in public places and informing friends/family of your plans</li>
                <li>You should trust your instincts and report suspicious behavior immediately</li>
                <li>We are not responsible for the conduct of users off the platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.3 Reporting & Appeals</h3>
              <p className="mb-2">If you experience or witness violations:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>Use the in-app reporting feature to flag users or content</li>
                <li>Block users who harass or bother you</li>
                <li>Contact support@getsltr.com for urgent safety concerns</li>
              </ul>
              <p>
                If your account is suspended or terminated, you may appeal by contacting legal@getsltr.com with a detailed explanation. Appeals are reviewed within 7 business days.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Services & Links</h2>
              <p className="mb-4">
                SLTR integrates with third-party service providers for payments, video calls, mapping, and other functionality. These services have their own terms and privacy policies, which govern your use of those services.
              </p>
              <p className="mb-4">
                Our platform may contain links to third-party websites or resources. We are not responsible for the content, accuracy, or practices of these third parties. Your interactions with third-party services are solely between you and the third party.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimers & Limitation of Liability</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">9.1 Service "As Is"</h3>
              <p className="mb-4 uppercase font-bold">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND TITLE.
              </p>
              <p className="mb-4">
                We do not warrant that:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>Any information or content is accurate, complete, or reliable</li>
                <li>Defects will be corrected</li>
                <li>The Service is free of viruses or harmful components</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">9.2 Limitation of Liability</h3>
              <p className="mb-4 uppercase font-bold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SLTR DIGITAL LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES</li>
                <li>DAMAGES ARISING FROM USER CONTENT OR CONDUCT OF OTHER USERS</li>
                <li>UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA</li>
                <li>STATEMENTS OR CONDUCT OF ANY THIRD PARTY ON THE SERVICE</li>
                <li>ANY OTHER MATTER RELATING TO THE SERVICE</li>
              </ul>
              <p className="mb-4">
                Our total liability to you for all claims arising from or relating to the Service shall not exceed the greater of (a) the amount you paid us in the 12 months before the claim arose, or (b) $100 USD.
              </p>
              <p className="text-sm">
                Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In such jurisdictions, our liability is limited to the maximum extent permitted by law.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Indemnification</h2>
              <p className="mb-4">
                You agree to indemnify, defend, and hold harmless SLTR DIGITAL LLC, its officers, directors, employees, agents, affiliates, and service providers from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from or relating to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Your use of or inability to use the Service</li>
                <li>Your violation of these Terms or any law or regulation</li>
                <li>Your User Content or any content you post, upload, or share</li>
                <li>Your violation of any third-party rights, including intellectual property or privacy rights</li>
                <li>Your interactions with other users, whether online or offline</li>
                <li>Any false, inaccurate, or misleading information you provide</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Modifications to the Service</h2>
              <p className="mb-4">
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice, for any reason. This includes:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Adding, removing, or changing features or functionality</li>
                <li>Changing pricing for Paid Services (with 30 days notice)</li>
                <li>Implementing new policies or requirements</li>
                <li>Discontinuing the Service entirely</li>
              </ul>
              <p className="mt-4">
                We will not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Intellectual Property</h2>
              <p className="mb-4">
                The SLTR platform, including its design, features, software, code, logos, trademarks, and all intellectual property rights therein, are owned by SLTR DIGITAL LLC or our licensors and are protected by U.S. and international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="mb-4">
                You may not:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Use our trademarks, logos, or branding without written permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Create derivative works or competitive products based on the Service</li>
                <li>Remove or modify any copyright, trademark, or proprietary notices</li>
                <li>Use the Service to develop competing services or train AI models</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">12.1 DMCA Copyright Policy</h3>
              <p className="mb-4">
                We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA). If you believe your copyright has been infringed, send a written notice to:
              </p>
              <div className="glass-bubble p-4 bg-white/5 border border-white/10">
                <p><strong>DMCA Agent:</strong> SLTR DIGITAL LLC</p>
                <p><strong>Email:</strong> dmca@getsltr.com</p>
                <p><strong>Address:</strong> Los Angeles, CA 90001</p>
              </div>
              <p className="mt-4 text-sm">
                Your notice must include: (1) identification of the copyrighted work, (2) identification of the infringing material, (3) your contact information, (4) a statement of good faith belief, (5) a statement of accuracy under penalty of perjury, and (6) your physical or electronic signature.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Export Controls</h2>
              <p>
                The Service may be subject to U.S. export control laws and regulations. You agree to comply with all applicable export and re-export control laws and regulations. You represent that you are not (a) located in a country subject to U.S. embargo, or (b) listed on any U.S. government list of prohibited or restricted parties.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Force Majeure</h2>
              <p>
                We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, pandemics, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. Governing Law & Jurisdiction</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
              </p>
              <p className="mb-4">
                Subject to the arbitration agreement in Section 16, you agree that any legal action or proceeding relating to these Terms or the Service shall be brought exclusively in the federal or state courts located in Los Angeles County, California, and you consent to personal jurisdiction in those courts.
              </p>
            </section>

            {/* Section 16 - CRITICAL */}
            <section className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">16. Arbitration Agreement & Class Action Waiver</h2>
              <p className="mb-4 font-bold text-red-400">
                PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO FILE A LAWSUIT IN COURT.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">16.1 Agreement to Arbitrate</h3>
              <p className="mb-4">
                You and SLTR agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Service (collectively, "Disputes") will be resolved by binding arbitration, rather than in court, except that:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>Either party may bring a claim in small claims court if it qualifies</li>
                <li>Either party may seek equitable relief in court for intellectual property infringement</li>
                <li>You may opt out of this arbitration agreement within 30 days of accepting these Terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">16.2 Arbitration Rules</h3>
              <p className="mb-4">
                The arbitration will be conducted by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, available at www.adr.org. The arbitration will be held in Los Angeles County, California, or at another mutually agreed location or via videoconference.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                <li>The arbitrator, not a judge or jury, will resolve the Dispute</li>
                <li>The arbitrator's decision is final and binding</li>
                <li>The arbitrator may award the same damages and relief as a court</li>
                <li>Discovery is more limited than in court</li>
                <li>AAA rules govern payment of fees</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">16.3 Class Action Waiver</h3>
              <p className="mb-4 font-bold uppercase">
                YOU AND SLTR AGREE THAT DISPUTES WILL BE RESOLVED ONLY ON AN INDIVIDUAL BASIS AND NOT AS A CLASS ACTION, CONSOLIDATED ACTION, OR REPRESENTATIVE ACTION. YOU AND SLTR WAIVE THE RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR ANY CONSOLIDATED OR REPRESENTATIVE PROCEEDING.
              </p>
              <p className="mb-4">
                If this class action waiver is found to be unenforceable, the entirety of this arbitration agreement shall be null and void.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">16.4 Opt-Out Right</h3>
              <p className="mb-4">
                You may opt out of this arbitration agreement by sending written notice to legal@getsltr.com within 30 days of first accepting these Terms. Your notice must include your name, email address, and a statement that you wish to opt out of arbitration.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">16.5 Exceptions</h3>
              <p>
                Notwithstanding the above, either party may bring a lawsuit in court if the Dispute involves intellectual property infringement, violation of the Computer Fraud and Abuse Act, or seeks injunctive or other equitable relief.
              </p>
            </section>

            {/* Section 17 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">17. Miscellaneous</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">17.1 Entire Agreement</h3>
              <p className="mb-4">
                These Terms, together with our Privacy Policy, Community Guidelines, and any other policies referenced herein, constitute the entire agreement between you and SLTR and supersede all prior agreements and understandings.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">17.2 Severability</h3>
              <p className="mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect. The invalid provision will be modified to the minimum extent necessary to make it valid and enforceable.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">17.3 Waiver</h3>
              <p className="mb-4">
                No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term. Our failure to enforce any right or provision shall not constitute a waiver of that right or provision.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">17.4 Assignment</h3>
              <p className="mb-4">
                You may not assign or transfer these Terms or your account without our prior written consent. We may assign or transfer these Terms, in whole or in part, without restriction.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">17.5 Relationship</h3>
              <p className="mb-4">
                No joint venture, partnership, employment, or agency relationship exists between you and SLTR as a result of these Terms or your use of the Service.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">17.6 Survival</h3>
              <p className="mb-4">
                Sections that by their nature should survive termination (including indemnification, limitation of liability, arbitration agreement, and governing law) will survive the termination of these Terms or your account.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">17.7 Electronic Communications</h3>
              <p>
                By using the Service, you consent to receive electronic communications from us, including emails, notifications, and posting of notices on the Service. You agree that all agreements, notices, disclosures, and other communications provided electronically satisfy any legal requirement that such communications be in writing.
              </p>
            </section>

            {/* Section 18 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">18. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="glass-bubble p-6 bg-white/5 border border-white/10 space-y-3">
                <p><strong>Email:</strong> legal@getsltr.com</p>
                <p><strong>Support:</strong> support@getsltr.com</p>
                <p><strong>DMCA/Copyright:</strong> dmca@getsltr.com</p>
                <p><strong>Company:</strong> SLTR DIGITAL LLC</p>
                <p><strong>Mailing Address:</strong><br />
                  SLTR DIGITAL LLC<br />
                  Attn: Legal Department<br />
                  Los Angeles, CA 90001<br />
                  United States
                </p>
              </div>
            </section>

            {/* Related Policies */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">19. Related Policies</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/privacy" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Privacy Policy</h3>
                  <p className="text-sm text-white/70">How we collect, use, and protect your data</p>
                </Link>
                <Link href="/guidelines" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Community Guidelines</h3>
                  <p className="text-sm text-white/70">Standards for respectful behavior</p>
                </Link>
                <Link href="/cookies" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Cookie Policy</h3>
                  <p className="text-sm text-white/70">How we use cookies and tracking</p>
                </Link>
                <Link href="/security" className="glass-bubble p-4 bg-white/5 border border-white/10 hover:bg-white/10 transition">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Security & Trust</h3>
                  <p className="text-sm text-white/70">How we protect your information</p>
                </Link>
              </div>
            </section>
          </div>

          <div className="text-center mt-12 pt-8 border-t border-white/10">
            <p className="text-white/60 text-sm mb-6">
              By using SLTR, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
