/**
 * SLTR Privilege System - Type Definitions
 * Clean, scalable, type-safe privilege management
 */

export type SubscriptionTier = 'free' | 'plus'

export type Feature =
  // Basic features (free tier)
  | 'basic_messaging'
  | 'profile_view'
  | 'basic_search'
  | 'basic_filters'

  // Plus-only features
  | 'video_calls'
  | 'create_groups'
  | 'create_channels'
  | 'join_groups'
  | 'travel_mode'
  | 'unlimited_views'
  | 'see_who_viewed'
  | 'unlimited_messaging'
  | 'ad_free'
  | 'dtfn_unlimited'
  | 'priority_dtfn_badge'
  | 'pin_favorites'
  | 'read_receipts'
  | 'advanced_filters'
  | 'extended_range'
  | 'privacy_controls'
  | 'location_spoofing'
  | 'incognito_mode'
  | 'private_albums'
  | 'profile_boost'

export interface FeatureLimit {
  feature: Feature
  tier: SubscriptionTier
  limit?: number // undefined = unlimited
  period?: 'day' | 'week' | 'month' | 'lifetime'
}

export interface Profile {
  id: string
  subscription_tier: SubscriptionTier
  subscription_expires_at?: string | null
  is_super_admin?: boolean
  premium?: boolean // Backward compatibility
}

export interface PrivilegeCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
  limit?: number
  upgradeRequired: boolean
}
