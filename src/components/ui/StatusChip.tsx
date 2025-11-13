'use client'

interface StatusChipProps {
  label: string
  variant?: 'online' | 'offline' | 'away' | 'default' | 'self' | 'party' | 'dtfn' | 'tag'
  size?: 'sm' | 'md'
}

export default function StatusChip({ 
  label, 
  variant = 'default',
  size = 'sm' 
}: StatusChipProps) {
  const baseStyles = 'inline-flex items-center rounded-full font-medium'
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  
  const variantStyles = {
    online: 'bg-green-500/20 text-green-400 border border-green-500/30',
    offline: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    away: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    default: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    self: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    party: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
    dtfn: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    tag: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  }

  return (
    <span className={`${baseStyles} ${sizeStyles} ${variantStyles[variant]}`}>
      {label}
    </span>
  )
}

