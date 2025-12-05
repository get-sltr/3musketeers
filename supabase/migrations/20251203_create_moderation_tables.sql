-- Create moderation tables for admin actions
-- Purpose: Track moderation actions and add account status fields
-- Created: 2025-12-03

-- ============================================
-- ADD ACCOUNT STATUS FIELDS TO PROFILES
-- ============================================

-- Account status field
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'
CHECK (account_status IN ('active', 'suspended', 'banned'));

-- Suspension fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- Ban fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Warning tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_warning_at TIMESTAMP WITH TIME ZONE;

-- Indexes for account status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_account_status
ON public.profiles(account_status);

CREATE INDEX IF NOT EXISTS idx_profiles_suspended_until
ON public.profiles(suspended_until)
WHERE suspended_until IS NOT NULL;

-- ============================================
-- MODERATION ACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'warn',
    'suspend',
    'ban',
    'unsuspend',
    'unban',
    'report_status_update',
    'profile_edit',
    'content_removal'
  )),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  reason TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for moderation actions
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin_id
ON public.moderation_actions(admin_id);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user_id
ON public.moderation_actions(target_user_id);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_report_id
ON public.moderation_actions(target_report_id);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_action_type
ON public.moderation_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at
ON public.moderation_actions(created_at DESC);

-- Enable RLS
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only service role (admins) can access
CREATE POLICY "Service role can manage moderation actions"
  ON public.moderation_actions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Admins can view via service role, regular users cannot
CREATE POLICY "Admins can view moderation actions"
  ON public.moderation_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ============================================
-- FUNCTION: Check if user is suspended/banned
-- ============================================

CREATE OR REPLACE FUNCTION public.is_user_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status TEXT;
  suspended_until TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT
    p.account_status,
    p.suspended_until
  INTO user_status, suspended_until
  FROM public.profiles p
  WHERE p.id = user_id;

  -- User doesn't exist
  IF user_status IS NULL THEN
    RETURN FALSE;
  END IF;

  -- User is banned
  IF user_status = 'banned' THEN
    RETURN FALSE;
  END IF;

  -- User is suspended - check if suspension has expired
  IF user_status = 'suspended' THEN
    IF suspended_until IS NULL OR suspended_until > NOW() THEN
      RETURN FALSE;
    ELSE
      -- Suspension expired, update status
      UPDATE public.profiles
      SET account_status = 'active',
          suspended_until = NULL,
          suspended_reason = NULL
      WHERE id = user_id;
      RETURN TRUE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Auto-expire suspensions
-- ============================================

CREATE OR REPLACE FUNCTION public.expire_suspensions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.profiles
  SET
    account_status = 'active',
    suspended_until = NULL,
    suspended_reason = NULL
  WHERE account_status = 'suspended'
    AND suspended_until IS NOT NULL
    AND suspended_until <= NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Moderation Statistics
-- ============================================

CREATE OR REPLACE VIEW public.moderation_stats AS
SELECT
  action_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30d
FROM public.moderation_actions
GROUP BY action_type;

-- ============================================
-- PERMISSIONS
-- ============================================

-- Grant authenticated users limited access (for profile checks)
GRANT SELECT ON public.profiles TO authenticated;

-- Service role has full access
GRANT ALL ON public.moderation_actions TO service_role;
GRANT ALL ON public.moderation_stats TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.is_user_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_active(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_suspensions() TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.moderation_actions IS 'Audit log of all moderation actions taken by admins';
COMMENT ON COLUMN public.profiles.account_status IS 'User account status: active, suspended, or banned';
COMMENT ON COLUMN public.profiles.suspended_until IS 'Timestamp when suspension expires (null if permanent or not suspended)';
COMMENT ON COLUMN public.profiles.warning_count IS 'Number of warnings issued to user';
COMMENT ON FUNCTION public.is_user_active(UUID) IS 'Check if user account is active (not suspended or banned)';
COMMENT ON FUNCTION public.expire_suspensions() IS 'Automatically expire suspensions that have passed their end date';
