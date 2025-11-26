-- =============================================================================
-- SLTR Usage Tracking for Free Tier Limits
-- Tracks daily message sends and profile views for monetization
-- =============================================================================

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('message_sent', 'profile_viewed')),
  target_id UUID, -- The recipient (for messages) or viewed profile (for views)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE -- For easy daily aggregation
);

-- Index for fast daily count queries
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date 
  ON usage_tracking(user_id, action_type, date);

-- Index for checking specific views (prevent counting same profile multiple times)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_unique_views 
  ON usage_tracking(user_id, action_type, target_id, date);

-- =============================================================================
-- Function to get daily usage counts
-- =============================================================================
CREATE OR REPLACE FUNCTION get_daily_usage(
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM usage_tracking
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND date = CURRENT_DATE
  );
END;
$$;

-- =============================================================================
-- Function to check if user can perform action (respects limits)
-- =============================================================================
CREATE OR REPLACE FUNCTION can_perform_action(
  p_user_id UUID,
  p_action_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_is_founder BOOLEAN;
BEGIN
  -- Get user's subscription tier and founder status
  SELECT 
    COALESCE(subscription_tier, 'free'),
    COALESCE(founder, false)
  INTO v_tier, v_is_founder
  FROM profiles
  WHERE id = p_user_id;

  -- Founders and Plus members have unlimited access
  IF v_is_founder OR v_tier = 'plus' THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'current', 0,
      'limit', -1,
      'remaining', -1,
      'tier', v_tier
    );
  END IF;

  -- Get current daily count
  v_current_count := get_daily_usage(p_user_id, p_action_type);

  -- Set limits based on action type
  CASE p_action_type
    WHEN 'message_sent' THEN v_limit := 10;  -- 10 messages/day for free
    WHEN 'profile_viewed' THEN v_limit := 20; -- 20 profile views/day for free
    ELSE v_limit := 100; -- Default high limit
  END CASE;

  RETURN jsonb_build_object(
    'allowed', v_current_count < v_limit,
    'current', v_current_count,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_current_count),
    'tier', v_tier
  );
END;
$$;

-- =============================================================================
-- Function to record usage (with duplicate view prevention)
-- =============================================================================
CREATE OR REPLACE FUNCTION record_usage(
  p_user_id UUID,
  p_action_type TEXT,
  p_target_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_can_perform JSONB;
  v_already_viewed BOOLEAN;
BEGIN
  -- Check if action is allowed
  v_can_perform := can_perform_action(p_user_id, p_action_type);
  
  IF NOT (v_can_perform->>'allowed')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily limit reached',
      'usage', v_can_perform
    );
  END IF;

  -- For profile views, check if already viewed today (don't double count)
  IF p_action_type = 'profile_viewed' AND p_target_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM usage_tracking
      WHERE user_id = p_user_id
        AND action_type = 'profile_viewed'
        AND target_id = p_target_id
        AND date = CURRENT_DATE
    ) INTO v_already_viewed;

    IF v_already_viewed THEN
      -- Already viewed today, don't count again but allow action
      RETURN jsonb_build_object(
        'success', true,
        'counted', false,
        'usage', v_can_perform
      );
    END IF;
  END IF;

  -- Record the action
  INSERT INTO usage_tracking (user_id, action_type, target_id)
  VALUES (p_user_id, p_action_type, p_target_id);

  -- Return updated counts
  RETURN jsonb_build_object(
    'success', true,
    'counted', true,
    'usage', can_perform_action(p_user_id, p_action_type)
  );
END;
$$;

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage (via function)
CREATE POLICY "Users can insert own usage"
  ON usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Grant permissions
-- =============================================================================
GRANT SELECT, INSERT ON usage_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_usage TO authenticated;
GRANT EXECUTE ON FUNCTION can_perform_action TO authenticated;
GRANT EXECUTE ON FUNCTION record_usage TO authenticated;

