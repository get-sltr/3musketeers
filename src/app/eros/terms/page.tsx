'use client';

export default function ErosTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">EROS Terms of Service</h1>
          <p className="text-green-100">Agreement for EROS dating intelligence service</p>
          <p className="text-sm mt-4 opacity-90">Last updated: November 20, 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 1. Acceptance of Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using EROS, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        {/* 2. Use License */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
          <p className="text-gray-700 mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on EROS for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to decompile or reverse engineer any software on EROS</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of EROS</li>
          </ul>
        </section>

        {/* 3. Account Responsibility */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Responsibility</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>You are responsible for maintaining the confidentiality of your password</li>
            <li>You agree to accept responsibility for all activities that occur under your account</li>
            <li>You must be 18 years or older to use EROS</li>
            <li>You must provide accurate and truthful information in your profile</li>
            <li>You are responsible for all content you post or transmit</li>
          </ul>
        </section>

        {/* 4. User Conduct */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Conduct</h2>
          <p className="text-gray-700 mb-4">You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Harass, abuse, or threaten other users</li>
            <li>Post or transmit obscene, profane, or offensive content</li>
            <li>Impersonate another person or entity</li>
            <li>Engage in catfishing or deceptive practices</li>
            <li>Share explicit sexual content or solicit sexual services</li>
            <li>Use EROS for commercial purposes or spam</li>
            <li>Attempt to gain unauthorized access to EROS systems</li>
            <li>Collect or track personal information of other users without consent</li>
          </ul>
        </section>

        {/* 5. Content Guidelines */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content Guidelines</h2>
          <div className="border-l-4 border-green-700 pl-4 py-2">
            <h3 className="font-semibold text-gray-800 mb-2">Appropriate Content</h3>
            <p className="text-gray-700">Authentic photos, genuine bios, real interests, respectful communication, and accurate information about yourself</p>
          </div>
          <div className="border-l-4 border-green-700 pl-4 py-2 mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Prohibited Content</h3>
            <p className="text-gray-700">Hate speech, violence, harassment, explicit sexual content, hate speech, discrimination, or scams</p>
          </div>
          <p className="text-gray-600 text-sm bg-red-50 p-4 rounded border-l-4 border-red-500 mt-4">
            <strong>Violation:</strong> Accounts violating content guidelines will be suspended or permanently banned.
          </p>
        </section>

        {/* 6. EROS AI Powered by Anthropic */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. EROS AI Powered by Anthropic</h2>
          <p className="text-gray-700 mb-4">
            EROS uses Anthropic's Claude AI for intelligent matching and real-time assistance. By using EROS, you agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Your messages may be processed by Claude AI for assistance and analysis</li>
            <li>Anthropic may analyze anonymized data to improve their models</li>
            <li>You have read and agree to Anthropic's Privacy Policy (https://www.anthropic.com/privacy)</li>
            <li>Claude AI decisions are generated by AI algorithms and may not be perfect</li>
            <li>You are responsible for verifying information provided by EROS before acting on it</li>
          </ul>
        </section>

        {/* 7. Limitation of Liability */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            EROS is provided "AS IS" without warranties of any kind. In no event shall SLTR, its directors, employees, or agents be liable for any damages, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Direct, indirect, incidental, special, or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Damages arising from use or inability to use EROS</li>
            <li>Damages arising from errors, omissions, or inaccuracies</li>
            <li>Damages arising from third-party conduct or content</li>
          </ul>
        </section>

        {/* 8. Disclaimer of Warranties */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
          <p className="text-gray-700">
            EROS makes no warranties or representations about the accuracy, completeness, or reliability of any content on EROS. EROS is provided on an "as-is" basis. SLTR does not warrant that EROS will be uninterrupted, timely, secure, or error-free.
          </p>
        </section>

        {/* 9. Indemnification */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
          <p className="text-gray-700">
            You agree to indemnify and hold harmless SLTR, its officers, directors, employees, agents, and successors from any claims, damages, losses, or expenses (including attorney's fees) arising from your use of EROS or your violation of these terms.
          </p>
        </section>

        {/* 10. Termination */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
          <p className="text-gray-700 mb-4">
            SLTR reserves the right to terminate your account at any time for any reason, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Violation of these terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Harassment or abuse of other users</li>
            <li>Failure to maintain accurate information</li>
            <li>Non-payment of fees (if applicable)</li>
          </ul>
        </section>

        {/* 11. Modifications to Terms */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Modifications to Terms</h2>
          <p className="text-gray-700">
            SLTR may modify these terms at any time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of EROS constitutes acceptance of modified terms.
          </p>
        </section>

        {/* 12. Governing Law */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These terms are governed by and construed in accordance with the laws of [Jurisdiction], and you irrevocably submit to the exclusive jurisdiction of the courts located in [Jurisdiction].
          </p>
          <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-700">
            <p className="text-gray-700"><strong>Questions?</strong> Contact legal@sltr.app</p>
          </div>
        </section>
      </div>
    </div>
  );
}
