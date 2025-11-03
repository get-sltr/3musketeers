"use client"

interface CornerButtonsProps {
  onToggleMenu: () => void
  onToggleNight: () => void
  isNight: boolean
  onCenter: () => void
  onMessages: () => void
  onGroups: () => void
}

export default function CornerButtons({
  onToggleMenu,
  onToggleNight,
  isNight,
  onCenter,
  onMessages,
  onGroups,
}: CornerButtonsProps) {
  return (
    <>
      {/* Top-left: menu */}
      <button
        onClick={onToggleMenu}
        className="fixed top-4 left-4 z-50 w-12 h-12 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center hover:border-cyan-400 hover:scale-105 transition"
        title="Menu"
      >
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
      </button>

      {/* Top-right: night mode */}
      <button
        onClick={onToggleNight}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center hover:border-cyan-400 hover:scale-105 transition"
        title="Night Mode"
      >
        {isNight ? (
          <svg className="w-6 h-6 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        ) : (
          <svg className="w-6 h-6 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.05l-1.41-1.41M6.46 6.46L5.05 5.05m12.9 0l-1.41 1.41M6.46 17.54l-1.41 1.41"/></svg>
        )}
      </button>

      {/* Bottom-left: messages */}
      <div className="fixed bottom-24 left-4 z-50 flex flex-col gap-3">
        <button onClick={onMessages} className="w-12 h-12 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center hover:border-cyan-400 hover:scale-105 transition" title="Messages">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </button>
        <button onClick={onGroups} className="w-12 h-12 rounded-xl bg-black/80 border border-white/10 flex items-center justify-center hover:border-cyan-400 hover:scale-105 transition" title="Groups">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-3-3.87M7 21v-2a4 4 0 013-3.87M7 8a4 4 0 118 0 4 4 0 11-8 0z"/></svg>
        </button>
      </div>

      {/* Bottom-right: center */}
      <button
        onClick={onCenter}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-black/90 border-2 border-cyan-500/40 flex items-center justify-center hover:border-cyan-400 hover:scale-110 transition shadow-lg"
        title="Center location"
      >
        <svg className="w-7 h-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
      </button>
    </>
  )
}
