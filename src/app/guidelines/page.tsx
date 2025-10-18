export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 gradient-text">Community Guidelines</h1>
        
        <div className="space-y-6">
          <section className="glass-bubble p-6">
            <h2 className="text-xl font-semibold mb-3">🔞 Age Requirement</h2>
            <p className="text-gray-300">
              SLTR is strictly 18+. We verify age during signup. Any user found to be underage will be permanently banned.
            </p>
          </section>

          <section className="glass-bubble p-6">
            <h2 className="text-xl font-semibold mb-3">🤝 Respect & Consent</h2>
            <p className="text-gray-300 mb-2">
              All interactions must be consensual and respectful. We have zero tolerance for:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Harassment or bullying</li>
              <li>Hate speech or discrimination</li>
              <li>Unsolicited explicit content</li>
              <li>Non-consensual sharing of photos/info</li>
            </ul>
          </section>

          <section className="glass-bubble p-6">
            <h2 className="text-xl font-semibold mb-3">🔒 Safety First</h2>
            <ul className="text-gray-300 space-y-2">
              <li>• Meet in public places for first dates</li>
              <li>• Tell a friend where you're going</li>
              <li>• Trust your instincts - block suspicious users</li>
              <li>• Never share financial information</li>
              <li>• Report any concerning behavior immediately</li>
            </ul>
          </section>

          <section className="glass-bubble p-6">
            <h2 className="text-xl font-semibold mb-3">🚫 Prohibited Content</h2>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Fake profiles or catfishing</li>
              <li>Spam or commercial solicitation</li>
              <li>Illegal content or activities</li>
              <li>Minors (anyone under 18)</li>
              <li>Violence or threats</li>
            </ul>
          </section>

          <section className="glass-bubble p-6">
            <h2 className="text-xl font-semibold mb-3">⚖️ Consequences</h2>
            <p className="text-gray-300">
              Violations of these guidelines may result in:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 mt-2">
              <li>Warning</li>
              <li>Temporary suspension</li>
              <li>Permanent ban</li>
              <li>Report to authorities (for illegal activity)</li>
            </ul>
          </section>

          <section className="glass-bubble p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
            <h2 className="text-xl font-semibold mb-3">💙 LGBTQ+ Safe Space</h2>
            <p className="text-gray-300">
              SLTR is a safe, inclusive space for the LGBTQ+ community. Homophobia, transphobia, and discrimination of any kind are not tolerated.
            </p>
          </section>

          <div className="text-center text-sm text-gray-500 mt-8">
            Last updated: October 2025
          </div>
        </div>
      </div>
    </div>
  )
}
