'use client';

export default function ErosPrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-500 to-green-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">EROS Privacy Policy</h1>
          <p className="text-lime-100">Your data. Your control. Your trust.</p>
          <p className="text-sm mt-4 opacity-90">Last updated: November 20, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Summary */}
        <div className="bg-lime-50 border-2 border-lime-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-lime-900 mb-3">🔒 Quick Summary</h2>
          <ul className="space-y-2 text-lime-900">
            <li>✓ We only collect data necessary for matching</li>
            <li>✓ Your conversations are end-to-end encrypted</li>
            <li>✓ We never sell your data to third parties</li>
            <li>✓ You can delete your account and all data anytime</li>
            <li>✓ EROS AI runs locally on your device when possible</li>
          </ul>
        </div>

        {/* 1. Introduction */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            SLTR ("we," "us," "our") operates the EROS dating intelligence service ("EROS," "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
          <p className="text-gray-700">
            EROS is powered by Anthropic's Claude AI, which means your data benefits from enterprise-grade security and privacy standards. We are committed to protecting your privacy while delivering the most intelligent matching experience.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-3 mt-6">Profile Information</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Name, age, bio, photos</li>
            <li>Location (latitude/longitude)</li>
            <li>Interests and preferences</li>
            <li>Relationship goals</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Behavioral Data</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Match interactions (likes, skips, messages)</li>
            <li>Chat conversations with EROS</li>
            <li>Search queries and preferences</li>
            <li>App usage patterns (when you're active)</li>
            <li>Device information (OS, version)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">Technical Data</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>IP address and device ID</li>
            <li>Cookies and local storage</li>
            <li>Error logs and crash reports</li>
            <li>Performance metrics</li>
          </ul>

          <p className="text-gray-600 text-sm bg-blue-50 p-4 rounded mt-4">
            <strong>Note:</strong> We collect behavioral data specifically to power EROS's intelligent matching algorithms. This data is anonymized and aggregated before being used for model improvement.
          </p>
        </section>

        {/* 3. How We Use Your Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. How We Use Your Data</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-lime-500 pl-4">
              <h3 className="font-semibold mb-2">Matching & Recommendations</h3>
              <p className="text-gray-700">Your profile and behavioral data train EROS to find your best matches. EROS analyzes compatibility factors and learns your preferences over time to improve recommendations.</p>
            </div>

            <div className="border-l-4 border-lime-500 pl-4">
              <h3 className="font-semibold mb-2">AI Assistant</h3>
              <p className="text-gray-700">Chat messages are analyzed by Claude AI (via Anthropic) to provide dating advice, answer questions, and offer real-time support. Your messages are not used to train public models.</p>
            </div>

            <div className="border-l-4 border-lime-500 pl-4">
              <h3 className="font-semibold mb-2">Personalization</h3>
              <p className="text-gray-700">We use your data to customize your experience, including notification preferences, interface language, and content recommendations.</p>
            </div>

            <div className="border-l-4 border-lime-500 pl-4">
              <h3 className="font-semibold mb-2">Safety & Moderation</h3>
              <p className="text-gray-700">We analyze messages for harmful content, inappropriate behavior, and policy violations to keep the community safe.</p>
            </div>

            <div className="border-l-4 border-lime-500 pl-4">
              <h3 className="font-semibold mb-2">Service Improvement</h3>
              <p className="text-gray-700">Anonymized data helps us improve EROS's accuracy, fix bugs, and develop new features.</p>
            </div>
          </div>
        </section>

        {/* 4. Data Processing & EROS Innovation */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. EROS: Powered by Anthropic</h2>
          <p className="text-gray-700 mb-4">
            EROS leverages Anthropic's Claude AI for intelligent matching and real-time assistance. This partnership ensures:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li><strong>Enterprise Security:</strong> Your data is processed with Anthropic's enterprise-grade security protocols</li>
            <li><strong>Privacy-First AI:</strong> Claude respects your privacy and doesn't retain conversation data for model training</li>
            <li><strong>Advanced Analysis:</strong> EROS can understand nuanced compatibility factors that traditional algorithms miss</li>
            <li><strong>Real-Time Support:</strong> Get dating advice and instant responses powered by one of the world's most capable AI systems</li>
          </ul>
          <p className="text-gray-600 text-sm bg-amber-50 p-4 rounded">
            <strong>Important:</strong> Anthropic processes some data according to their Privacy Policy (https://www.anthropic.com/privacy). We only share anonymized, aggregated data with Anthropic for model improvement.
          </p>
        </section>

        {/* 5. Data Sharing */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Data Sharing</h2>
          <p className="text-gray-700 mb-4">We share your data in limited circumstances:</p>
          
          <h3 className="font-semibold mb-3">We DO Share:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Profile info with other users (only your public profile)</li>
            <li>Anonymized data with Anthropic for AI improvement</li>
            <li>Data with legal authorities when required by law</li>
          </ul>

          <h3 className="font-semibold mb-3">We DO NOT Share:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Your data to advertisers or marketing companies</li>
            <li>Conversation transcripts with third parties</li>
            <li>Location data with anyone except for matching</li>
            <li>Financial information (we don't collect it)</li>
          </ul>
        </section>

        {/* 6. Data Security */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Data Security</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>All data is encrypted in transit (TLS 1.3)</li>
            <li>Sensitive data encrypted at rest (AES-256)</li>
            <li>Regular security audits and penetration testing</li>
            <li>Staff access limited to minimum necessary</li>
            <li>Automatic backups with disaster recovery</li>
            <li>No raw passwords stored (hashed + salted)</li>
          </ul>
        </section>

        {/* 7. Your Rights */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">7. Your Privacy Rights</h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📥 Access Your Data</h3>
              <p className="text-gray-700">Request a copy of all your personal data in machine-readable format</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">✏️ Correct Your Data</h3>
              <p className="text-gray-700">Update or fix any inaccurate information in your profile</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🗑️ Delete Your Data</h3>
              <p className="text-gray-700">Request permanent deletion of your account and all associated data</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">❌ Opt-Out</h3>
              <p className="text-gray-700">Opt out of data processing for AI improvement (analysis will be limited)</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📋 Data Portability</h3>
              <p className="text-gray-700">Export your data to move it to another service</p>
            </div>
          </div>

          <p className="text-gray-600 text-sm bg-blue-50 p-4 rounded mt-6">
            To exercise any of these rights, email privacy@sltr.app with your request. We will respond within 30 days.
          </p>
        </section>

        {/* 8. Data Retention */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">8. Data Retention</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><strong>Active Account:</strong> Data retained for duration of account</li>
            <li><strong>After Deletion:</strong> Data permanently deleted within 30 days</li>
            <li><strong>Backups:</strong> Deleted from backups within 90 days</li>
            <li><strong>Legal Hold:</strong> Data may be retained if required by law</li>
            <li><strong>Anonymized Data:</strong> Kept indefinitely for research and improvement</li>
          </ul>
        </section>

        {/* 9. Compliance */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">9. Global Compliance</h2>
          <p className="text-gray-700">EROS complies with:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>GDPR (EU General Data Protection Regulation)</li>
            <li>CCPA (California Consumer Privacy Act)</li>
            <li>SOC 2 Type II compliance</li>
            <li>ISO 27001 Information Security</li>
            <li>HIPAA-adjacent health data standards</li>
          </ul>
        </section>

        {/* 10. Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">10. Questions?</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">If you have privacy concerns or questions:</p>
            <p className="text-gray-700"><strong>Email:</strong> privacy@sltr.app</p>
            <p className="text-gray-700"><strong>Mail:</strong> SLTR Inc., Privacy Team, [Address]</p>
            <p className="text-gray-700"><strong>Response Time:</strong> Within 30 days</p>
          </div>
        </section>
      </div>
    </div>
  );
}
