/**
 * SLTR Privilege System - Main Export
 * Clean, scalable, sustainable privilege management
 *
 * Designed for 100,000+ concurrent users with:
 * - Multi-tier caching (memory + Redis)
 * - Database connection pooling
 * - Rate limiting
 * - Optimized indexes
 */

// Types
export type {
  SubscriptionTier,
  Feature,
  FeatureLimit,
  Profile,
  PrivilegeCheckResult,
} from './types'

// Configuration
export {
  FEATURE_LIMITS,
  FREE_TIER_LIMITS,
  PLUS_FEATURES,
  FEATURE_NAMES,
  getFeaturesForTier,
  requiresPlusSubscription,
} from './config'

// Core checker functions
export {
  getActiveTier,
  isPlusSubscriber,
  hasFeature,
  canUseFeature,
  checkDTFNLimit,
  recordDTFNActivation,
  recordFeatureUsage,
} from './checker'

// Cache utilities
export {
  getCachedProfile,
  setCachedProfile,
  invalidateProfileCache,
  batchInvalidateCache,
  checkRateLimit,
  clearOldRateLimits,
  getCacheStats,
} from './cache'

// API middleware
export {
  requireAuth,
  requirePlus,
  requireFeature,
  withAuth,
  withPlus,
  withFeature,
} from './middleware'
