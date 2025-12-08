"use client"

interface CornerButtonsProps {
  onToggleMenu: () => void
  onCenter: () => void
  rightOffset?: number
}

export default function CornerButtons({
  onToggleMenu,
  onCenter,
  rightOffset = 16,
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

      {/* Bottom-right: center */}
      <button
        onClick={onCenter}
        className="fixed bottom-24 z-50 w-14 h-14 rounded-full bg-black/90 border-2 border-cyan-500/40 flex items-center justify-center hover:border-cyan-400 hover:scale-110 transition shadow-lg"
        style={{ right: rightOffset }}
        title="Center location"
      >
        <svg className="w-7 h-7 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
      </button>
    </>
  )
}
