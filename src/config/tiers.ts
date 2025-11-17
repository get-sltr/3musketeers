// Central configuration for all subscription tiers
// This makes it easy to update pricing, features, or add new tiers

export type TierType = 'free' | 'member' | 'founder' | 'blackcard'

export interface TierConfig {
  id: TierType
  name: string
  displayName: string
  description: string
  price: number
  priceId: string | null
  interval: 'month' | 'lifetime' | null
  features: string[]
  badge: string
  color: string
  gradient: string
}

export const TIER_CONFIG: Record<TierType, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    displayName: 'Free Account',
    description: 'Basic access to SLTR',
    price: 0,
    priceId: null,
    interval: null,
    features: [
      'Basic profile',
      'Limited messages',
      'Grid view only',
      'Standard support'
    ],
    badge: '🔥',
    color: '#ff00ff',
    gradient: 'from-magenta-500 to-pink-500'
  },
  member: {
    id: 'member',
    name: 'SLTR+',
    displayName: 'SLTR+ Premium',
    description: 'Unlock the full SLTR experience',
    price: 12.99,
    priceId: 'price_1SQ3YU3Au54W8cq8OHVyLAiq',
    interval: 'month',
    features: [
      'Unlimited messages',
      'Map view unlocked',
      'See who viewed your profile',
      'Priority in discovery',
      'Video calls',
      'DTFN status',
      'Plus badge on profile',
      'Priority support'
    ],
    badge: '⭐',
    color: '#00d4ff',
    gradient: 'from-cyan-500 to-blue-500'
  },
  founder: {
    id: 'founder',
    name: "Founder's Circle",
    displayName: "Founder's Circle",
    description: 'Elite lifetime access with exclusive perks',
    price: 199,
    priceId: 'price_1SQ3VO3Au54W8cq8xXnDe2dy',
    interval: 'lifetime',
    features: [
      'All SLTR+ features',
      'Private invitations to SLTR launch parties',
      'Free VIP entry to all SLTR events',
      'Priority entry and VIP sections',
      "Exclusive Founder's badge",
      'Priority in discovery',
      'Dedicated support team',
      "Private Founder's channel",
      'Early access to new features',
      'Lifetime access - never pay again'
    ],
    badge: '👑',
    color: '#FF6B35',
    gradient: 'from-orange-500 to-amber-500'
  },
  blackcard: {
    id: 'blackcard',
    name: 'Black Card',
    displayName: 'Black Card Elite',
    description: 'Invite-only exclusive access',
    price: 999,
    priceId: null, // Invite only - no public checkout
    interval: 'lifetime',
    features: [
      'All Founder features',
      'Invite-only exclusivity',
      'Black Card badge',
      'Ultimate VIP status',
      'Direct access to founder'
    ],
    badge: '♠️',
    color: '#000000',
    gradient: 'from-gray-900 to-black'
  }
}

// Helper functions
export function getTierConfig(tier: TierType): TierConfig {
  return TIER_CONFIG[tier]
}

export function getTierPrice(tier: TierType): number {
  return TIER_CONFIG[tier].price
}

export function getTierPriceId(tier: TierType): string | null {
  return TIER_CONFIG[tier].priceId
}

export function formatPrice(tier: TierType): string {
  const config = TIER_CONFIG[tier]
  if (config.price === 0) return 'Free'
  if (config.interval === 'month') return `$${config.price}/mo`
  if (config.interval === 'lifetime') return `$${config.price} one-time`
  return `$${config.price}`
}

export function canCheckout(tier: TierType): boolean {
  return TIER_CONFIG[tier].priceId !== null
}
