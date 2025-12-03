-- Add moderation schema for admin backend
-- Purpose: Support user moderation actions (warn/suspend/ban) and admin-only access
-- Created: 2025-12-03

-- ============================================
-- ADD ACCOUNT STATUS TO PROFILES
-- ============================================

-- Add account_status column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'warned', 'suspended', 'banned'));

-- Add account_status_reason for tracking why status was changed
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status_reason TEXT;

-- Add account_status_updated_at for tracking when status was last changed
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status_updated_at TIMESTAMPTZ;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_status
ON public.profiles(account_status)
WHERE account_status != 'active';

-- ============================================
-- MODERATION ACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Allow NULL for deleted admins
  action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'suspend', 'ban', 'unwarn', 'unsuspend', 'unban')),
  reason TEXT NOT NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  duration_days INTEGER, -- For temporary suspensions
  expires_at TIMESTAMPTZ, -- When suspension expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON public.moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin ON public.moderation_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON public.moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON public.moderation_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON public.moderation_actions(report_id) WHERE report_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_actions
-- Only super admins can view moderation actions
CREATE POLICY "Super admins can view all moderation actions"
  ON public.moderation_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Only super admins can insert moderation actions
CREATE POLICY "Super admins can insert moderation actions"
  ON public.moderation_actions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Service role has full access
CREATE POLICY "Service role can manage moderation actions"
  ON public.moderation_actions
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- UPDATE REPORTS TABLE POLICIES FOR SUPER ADMIN
-- ============================================

-- Drop existing admin-related policies if they exist
DROP POLICY IF EXISTS "Super admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Super admins can update reports" ON public.reports;

-- Super admins can view all reports
CREATE POLICY "Super admins can view all reports"
  ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- Super admins can update reports
CREATE POLICY "Super admins can update reports"
  ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_super_admin = true
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get moderation stats (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_moderation_stats(
  p_admin_id UUID
)
RETURNS TABLE (
  total_reports BIGINT,
  pending_reports BIGINT,
  reviewed_reports BIGINT,
  resolved_reports BIGINT,
  dismissed_reports BIGINT,
  total_users BIGINT,
  active_users BIGINT,
  warned_users BIGINT,
  suspended_users BIGINT,
  banned_users BIGINT,
  total_moderation_actions BIGINT,
  actions_last_24h BIGINT,
  actions_last_7d BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if requesting user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = p_admin_id
    AND profiles.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.reports)::BIGINT AS total_reports,
    (SELECT COUNT(*) FROM public.reports WHERE status = 'pending')::BIGINT AS pending_reports,
    (SELECT COUNT(*) FROM public.reports WHERE status = 'reviewed')::BIGINT AS reviewed_reports,
    (SELECT COUNT(*) FROM public.reports WHERE status = 'resolved')::BIGINT AS resolved_reports,
    (SELECT COUNT(*) FROM public.reports WHERE status = 'dismissed')::BIGINT AS dismissed_reports,
    (SELECT COUNT(*) FROM public.profiles)::BIGINT AS total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE account_status = 'active' OR account_status IS NULL)::BIGINT AS active_users,
    (SELECT COUNT(*) FROM public.profiles WHERE account_status = 'warned')::BIGINT AS warned_users,
    (SELECT COUNT(*) FROM public.profiles WHERE account_status = 'suspended')::BIGINT AS suspended_users,
    (SELECT COUNT(*) FROM public.profiles WHERE account_status = 'banned')::BIGINT AS banned_users,
    (SELECT COUNT(*) FROM public.moderation_actions)::BIGINT AS total_moderation_actions,
    (SELECT COUNT(*) FROM public.moderation_actions WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT AS actions_last_24h,
    (SELECT COUNT(*) FROM public.moderation_actions WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT AS actions_last_7d;
END;
$$;

-- Function to get top reported users
CREATE OR REPLACE FUNCTION public.get_top_reported_users(
  p_admin_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  photo_url TEXT,
  report_count BIGINT,
  account_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if requesting user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = p_admin_id
    AND profiles.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    r.reported_user_id AS user_id,
    p.display_name,
    p.photo_url,
    COUNT(*)::BIGINT AS report_count,
    COALESCE(p.account_status, 'active') AS account_status
  FROM public.reports r
  JOIN public.profiles p ON p.id = r.reported_user_id
  GROUP BY r.reported_user_id, p.display_name, p.photo_url, p.account_status
  ORDER BY report_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to get recent moderation actions
CREATE OR REPLACE FUNCTION public.get_recent_moderation_actions(
  p_admin_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  target_user_id UUID,
  target_display_name TEXT,
  admin_user_id UUID,
  admin_display_name TEXT,
  action_type TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if requesting user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = p_admin_id
    AND profiles.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT
    ma.id,
    ma.target_user_id,
    tp.display_name AS target_display_name,
    ma.admin_user_id,
    ap.display_name AS admin_display_name,
    ma.action_type,
    ma.reason,
    ma.created_at
  FROM public.moderation_actions ma
  LEFT JOIN public.profiles tp ON tp.id = ma.target_user_id
  LEFT JOIN public.profiles ap ON ap.id = ma.admin_user_id
  ORDER BY ma.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- View for reports with category breakdown
CREATE OR REPLACE VIEW public.admin_report_breakdown AS
SELECT
  category,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS last_7d
FROM public.reports
GROUP BY category;

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT ON public.moderation_actions TO authenticated;
GRANT INSERT ON public.moderation_actions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_moderation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_reported_users TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_moderation_actions TO authenticated;
GRANT SELECT ON public.admin_report_breakdown TO authenticated;

-- Service role has full access
GRANT ALL ON public.moderation_actions TO service_role;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.profiles.account_status IS 'User account status: active, warned, suspended, banned';
COMMENT ON COLUMN public.profiles.account_status_reason IS 'Reason for account status change';
COMMENT ON TABLE public.moderation_actions IS 'Audit log of all moderation actions taken by admins';
COMMENT ON FUNCTION public.get_moderation_stats IS 'Returns moderation statistics (super admin only)';
COMMENT ON FUNCTION public.get_top_reported_users IS 'Returns most reported users (super admin only)';
COMMENT ON FUNCTION public.get_recent_moderation_actions IS 'Returns recent moderation actions (super admin only)';
