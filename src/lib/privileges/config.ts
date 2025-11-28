/**
 * SLTR Privilege System - Feature Configuration
 * Single source of truth for all feature limits
 */

import { Feature, FeatureLimit, SubscriptionTier } from './types'

/**
 * Feature limits configuration
 * Define all limits in one place for easy maintenance
 */
export const FEATURE_LIMITS: Record<Feature, FeatureLimit> = {
  // ==================== FREE TIER FEATURES ====================
  basic_messaging: {
    feature: 'basic_messaging',
    tier: 'free',
    limit: 50,
    period: 'day',
  },
  profile_view: {
    feature: 'profile_view',
    tier: 'free',
    limit: 100,
    period: 'day',
  },
  basic_search: {
    feature: 'basic_search',
    tier: 'free',
  },
  basic_filters: {
    feature: 'basic_filters',
    tier: 'free',
  },

  // ==================== PLUS TIER FEATURES ====================
  video_calls: {
    feature: 'video_calls',
    tier: 'plus',
  },
  voice_calls: {
    feature: 'voice_calls',
    tier: 'plus',
  },
  eros_ai: {
    feature: 'eros_ai',
    tier: 'plus',
  },
  create_groups: {
    feature: 'create_groups',
    tier: 'plus',
  },
  create_channels: {
    feature: 'create_channels',
    tier: 'plus',
  },
  join_groups: {
    feature: 'join_groups',
    tier: 'plus',
  },
  travel_mode: {
    feature: 'travel_mode',
    tier: 'plus',
  },
  unlimited_views: {
    feature: 'unlimited_views',
    tier: 'plus',
  },
  see_who_viewed: {
    feature: 'see_who_viewed',
    tier: 'plus',
  },
  unlimited_messaging: {
    feature: 'unlimited_messaging',
    tier: 'plus',
  },
  ad_free: {
    feature: 'ad_free',
    tier: 'plus',
  },
  dtfn_unlimited: {
    feature: 'dtfn_unlimited',
    tier: 'plus',
  },
  priority_dtfn_badge: {
    feature: 'priority_dtfn_badge',
    tier: 'plus',
  },
  pin_favorites: {
    feature: 'pin_favorites',
    tier: 'plus',
  },
  read_receipts: {
    feature: 'read_receipts',
    tier: 'plus',
  },
  advanced_filters: {
    feature: 'advanced_filters',
    tier: 'plus',
  },
  extended_range: {
    feature: 'extended_range',
    tier: 'plus',
  },
  privacy_controls: {
    feature: 'privacy_controls',
    tier: 'plus',
  },
  location_spoofing: {
    feature: 'location_spoofing',
    tier: 'plus',
  },
  incognito_mode: {
    feature: 'incognito_mode',
    tier: 'plus',
  },
  private_albums: {
    feature: 'private_albums',
    tier: 'plus',
  },
  profile_boost: {
    feature: 'profile_boost',
    tier: 'plus',
  },
}

/**
 * Special limits for free tier features
 * STRICT LIMITS - Monetization focused
 */
export const FREE_TIER_LIMITS = {
  DTFN_ACTIVATIONS: 4, // 4 times lifetime for free users
  DAILY_MESSAGES: 10, // 10 messages per day for free users
  DAILY_PROFILE_VIEWS: 20, // 20 profile views per day for free users
  MAX_FAVORITES: 10,
  MAP_RADIUS_MILES: 5,
} as const

/**
 * Plus tier benefits (for marketing/display)
 */
export const PLUS_FEATURES: Feature[] = [
  'video_calls',
  'voice_calls',
  'eros_ai',
  'create_groups',
  'create_channels',
  'travel_mode',
  'unlimited_views',
  'see_who_viewed',
  'unlimited_messaging',
  'ad_free',
  'dtfn_unlimited',
  'priority_dtfn_badge',
  'pin_favorites',
  'read_receipts',
  'advanced_filters',
  'extended_range',
  'privacy_controls',
  'location_spoofing',
  'incognito_mode',
  'private_albums',
  'profile_boost',
]

/**
 * Feature display names (for UI)
 */
export const FEATURE_NAMES: Record<Feature, string> = {
  basic_messaging: 'Basic Messaging',
  profile_view: 'Profile Views',
  basic_search: 'Basic Search',
  basic_filters: 'Basic Filters',
  video_calls: 'Video Calls',
  voice_calls: 'Voice Calls',
  eros_ai: 'EROS AI Assistant',
  create_groups: 'Create Groups',
  create_channels: 'Create Channels',
  join_groups: 'Join Groups',
  travel_mode: 'Travel Mode',
  unlimited_views: 'Unlimited Profile Views',
  see_who_viewed: 'See Who Viewed You',
  unlimited_messaging: 'Unlimited Messaging',
  ad_free: 'Ad-Free Experience',
  dtfn_unlimited: 'Unlimited DTFN',
  priority_dtfn_badge: 'Priority DTFN Badge',
  pin_favorites: 'Pin Favorites',
  read_receipts: 'Read Receipts',
  advanced_filters: 'Advanced Filters',
  extended_range: 'Extended Map Range',
  privacy_controls: 'Enhanced Privacy Controls',
  location_spoofing: 'Location Spoofing',
  incognito_mode: 'Incognito Browsing',
  private_albums: 'Private Photo Albums',
  profile_boost: 'Profile Boost',
}

/**
 * Get all features for a given tier
 */
export function getFeaturesForTier(tier: SubscriptionTier): Feature[] {
  return Object.values(FEATURE_LIMITS)
    .filter((limit) => limit.tier === tier || tier === 'plus')
    .map((limit) => limit.feature)
}

/**
 * Check if a feature requires Plus subscription
 */
export function requiresPlusSubscription(feature: Feature): boolean {
  return FEATURE_LIMITS[feature].tier === 'plus'
}
