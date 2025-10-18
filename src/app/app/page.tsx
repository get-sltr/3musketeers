'use client'

export default function AppPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 
          className="text-6xl font-black tracking-wider mb-4"
          style={{
            background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          SLTR
        </h1>
        <p className="text-white/60 text-lg">
          Welcome to the app! Phase 2 coming soon...
        </p>
      </div>
    </div>
  )
}
