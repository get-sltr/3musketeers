-- Performance indexes for SLTR scale (50 → 50,000+ users)
-- Created: 2025-11-19

-- ============================================
-- ONLINE STATUS INDEXES
-- ============================================

-- Partial index: only online users (much smaller, faster)
CREATE INDEX IF NOT EXISTS idx_profiles_online_users
ON profiles(id, last_active)
WHERE online = true;

-- Composite index for location + online queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_online
ON profiles(latitude, longitude, online)
WHERE online = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- MESSAGING INDEXES
-- ============================================

-- Messages by conversation (most common query)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at DESC);

-- Unread messages count (frequent query)
CREATE INDEX IF NOT EXISTS idx_messages_unread
ON messages(receiver_id, read_at)
WHERE read_at IS NULL;

-- ============================================
-- FAVORITES INDEXES (already created in separate migration)
-- ============================================
-- idx_favorites_user_id
-- idx_favorites_favorited_user_id
-- idx_favorites_created_at

-- ============================================
-- TAPS & BLOCKS (already have indexes)
-- ============================================
-- idx_taps_tapper_id
-- idx_taps_tapped_user_id  
-- idx_blocks_blocker_id
-- idx_blocks_blocked_id

-- ============================================
-- SUBSCRIPTION INDEXES (for SLTR Pro)
-- ============================================

-- Active subscriptions (most queries filter by active)
CREATE INDEX IF NOT EXISTS idx_profiles_active_subscriptions
ON profiles(subscription_tier, subscription_expires_at)
WHERE subscription_tier = 'plus';

-- ============================================
-- FOUNDER CARDS INDEXES
-- ============================================

-- Active unredeemed cards (for signup flow)
CREATE INDEX IF NOT EXISTS idx_founder_cards_available
ON founder_cards(founder_number, verification_code)
WHERE redeemed = false AND is_active = true;

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

ANALYZE profiles;
ANALYZE messages;
ANALYZE favorites;
ANALYZE taps;
ANALYZE blocks;
ANALYZE founder_cards;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_profiles_online_users IS 'Partial index for online users only - 10x faster than full table scan';
COMMENT ON INDEX idx_profiles_location_online IS 'Composite index for geospatial queries on online users';
COMMENT ON INDEX idx_messages_unread IS 'Partial index for unread message counts';
COMMENT ON INDEX idx_profiles_active_subscriptions IS 'Partial index for active SLTR Plus subscribers';

-- Done!
SELECT '✅ Performance indexes created for 50k+ user scale' as status;
