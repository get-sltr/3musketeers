type ChipVariant = 'dtfn' | 'party' | 'tag' | 'self'

interface StatusChipProps {
  variant: ChipVariant
  children: React.ReactNode
}

const getChipClass = (variant: ChipVariant) => {
  switch (variant) {
    case 'dtfn':
      return 'bg-gradient-to-r from-fuchsia-500/30 to-purple-500/40 text-fuchsia-100'
    case 'party':
      return 'bg-gradient-to-r from-cyan-500/25 to-blue-500/35 text-cyan-100'
    case 'self':
      return 'bg-white/20 text-white'
    default:
      return 'bg-white/10 text-white/70'
  }
}

export default function StatusChip({ variant, children }: StatusChipProps) {
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] ${getChipClass(variant)}`}>
      {children}
    </span>
  )
}