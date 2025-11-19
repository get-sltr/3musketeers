--
-- SLTR Privilege System - Database Migration
-- Optimized for high concurrency (50+ simultaneous users)
-- Includes indexes, caching, and RLS policies
--

-- ==================== SCHEMA CHANGES ====================

-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
CHECK (subscription_tier IN ('free', 'plus'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Update existing premium users to 'plus' tier
UPDATE profiles
SET subscription_tier = 'plus'
WHERE premium = true AND subscription_tier = 'free';

-- ==================== PERFORMANCE INDEXES ====================
-- Critical for handling 50+ concurrent users without slowdown

-- Index on subscription tier (frequently queried)
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier
ON profiles(subscription_tier)
WHERE subscription_tier = 'plus'; -- Partial index for Plus users only

-- Index on subscription expiry (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires
ON profiles(subscription_expires_at)
WHERE subscription_expires_at IS NOT NULL;

-- Composite index for privilege checks (most common query)
CREATE INDEX IF NOT EXISTS idx_profiles_id_subscription
ON profiles(id, subscription_tier, subscription_expires_at);

-- ==================== DTFN ACTIVATIONS TABLE ====================

CREATE TABLE IF NOT EXISTS dtfn_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance index for counting activations
CREATE INDEX IF NOT EXISTS idx_dtfn_user_active
ON dtfn_activations(user_id, activated_at)
WHERE deactivated_at IS NULL;

-- Enable RLS
ALTER TABLE dtfn_activations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activations
CREATE POLICY "Users can view own DTFN activations"
ON dtfn_activations
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own activations
CREATE POLICY "Users can record DTFN activations"
ON dtfn_activations
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ==================== FEATURE USAGE TRACKING (OPTIONAL) ====================
-- Helps understand what features users want
-- Can be used for analytics and limiting

CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for quick usage counts (day/week/month)
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature_time
ON feature_usage(user_id, feature, used_at DESC);

-- Partial index for recent usage (last 30 days)
CREATE INDEX IF NOT EXISTS idx_feature_usage_recent
ON feature_usage(user_id, feature, used_at)
WHERE used_at > NOW() - INTERVAL '30 days';

-- Enable RLS
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature usage"
ON feature_usage
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service can track feature usage"
ON feature_usage
FOR INSERT
WITH CHECK (true); -- Allow service role to insert

-- ==================== OPTIMIZED FUNCTIONS ====================

-- Check if user's subscription is active
-- CACHED by PostgreSQL for performance
CREATE OR REPLACE FUNCTION is_subscription_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT subscription_tier, subscription_expires_at
  INTO v_tier, v_expires
  FROM profiles
  WHERE id = p_user_id;

  -- Plus subscription that hasn't expired
  IF v_tier = 'plus' THEN
    IF v_expires IS NULL OR v_expires > NOW() THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
-- STABLE means function result is cacheable within a transaction

-- Check DTFN limit (optimized with count)
CREATE OR REPLACE FUNCTION check_dtfn_limit(p_user_id UUID)
RETURNS TABLE(can_activate BOOLEAN, activations_used INT, remaining INT) AS $$
DECLARE
  v_is_plus BOOLEAN;
  v_count INT;
  v_limit CONSTANT INT := 4; -- Free tier limit
BEGIN
  -- Check if Plus subscriber
  v_is_plus := is_subscription_active(p_user_id);

  -- Plus users have unlimited
  IF v_is_plus THEN
    RETURN QUERY SELECT TRUE, 0, -1; -- -1 = unlimited
    RETURN;
  END IF;

  -- Count activations for free users
  SELECT COUNT(*) INTO v_count
  FROM dtfn_activations
  WHERE user_id = p_user_id;

  -- Return result
  RETURN QUERY SELECT
    (v_count < v_limit),
    v_count::INT,
    GREATEST(0, v_limit - v_count)::INT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Count feature usage for limits (optimized)
CREATE OR REPLACE FUNCTION count_feature_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_period TEXT DEFAULT 'day'
)
RETURNS INT AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_count INT;
BEGIN
  -- Calculate start time based on period
  v_start_time := CASE p_period
    WHEN 'day' THEN DATE_TRUNC('day', NOW())
    WHEN 'week' THEN DATE_TRUNC('week', NOW())
    WHEN 'month' THEN DATE_TRUNC('month', NOW())
    ELSE '1970-01-01'::TIMESTAMPTZ -- lifetime
  END;

  -- Use appropriate table based on feature
  IF p_feature = 'basic_messaging' THEN
    SELECT COUNT(*) INTO v_count
    FROM messages
    WHERE sender_id = p_user_id
    AND created_at >= v_start_time;
  ELSIF p_feature = 'profile_view' THEN
    SELECT COUNT(*) INTO v_count
    FROM profile_views
    WHERE viewer_id = p_user_id
    AND viewed_at >= v_start_time;
  ELSE
    v_count := 0;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==================== RLS POLICIES FOR PRIVILEGES ====================

-- Only Plus users can create groups
CREATE POLICY "Plus users can create groups" ON groups
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_subscription_active(auth.uid()) OR is_super_admin = true)
  )
);

-- ==================== CLEANUP & MAINTENANCE ====================

-- Function to expire old subscriptions (run daily)
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS INT AS $$
DECLARE
  v_updated INT;
BEGIN
  -- Update expired Plus subscriptions to free
  UPDATE profiles
  SET subscription_tier = 'free'
  WHERE subscription_tier = 'plus'
  AND subscription_expires_at < NOW()
  AND subscription_expires_at IS NOT NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run daily (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('expire-subscriptions', '0 0 * * *', 'SELECT expire_old_subscriptions();');

-- ==================== COMMENTS FOR DOCUMENTATION ====================

COMMENT ON TABLE dtfn_activations IS 'Tracks DTFN badge activations for free tier limits';
COMMENT ON TABLE feature_usage IS 'Optional analytics table for tracking feature usage';
COMMENT ON FUNCTION is_subscription_active IS 'Cached check if user has active Plus subscription';
COMMENT ON FUNCTION check_dtfn_limit IS 'Returns DTFN activation limit status for user';
COMMENT ON FUNCTION count_feature_usage IS 'Counts feature usage within a time period';

-- ==================== GRANT PERMISSIONS ====================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION is_subscription_active TO authenticated;
GRANT EXECUTE ON FUNCTION check_dtfn_limit TO authenticated;
GRANT EXECUTE ON FUNCTION count_feature_usage TO authenticated;
