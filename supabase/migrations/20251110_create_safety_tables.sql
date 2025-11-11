-- Create safety tables for blocking and reporting users
-- Purpose: Production-ready user safety features with proper database persistence
-- Created: 2025-11-10

-- ============================================
-- BLOCKED USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id),
  -- Prevent users from blocking themselves
  CONSTRAINT no_self_block CHECK (user_id != blocked_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_at ON public.blocked_users(blocked_at);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
-- Users can see their own blocked list
CREATE POLICY "Users can view their own blocks"
  ON public.blocked_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can block other users
CREATE POLICY "Users can block others"
  ON public.blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unblock users they blocked
CREATE POLICY "Users can unblock others"
  ON public.blocked_users
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('harassment', 'fake', 'inappropriate', 'spam', 'other')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate reports from same user for same target
  UNIQUE(reporter_user_id, reported_user_id, created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_reporter_user_id ON public.reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
-- Users can view their own submitted reports
CREATE POLICY "Users can view their own reports"
  ON public.reports
  FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- Users can submit reports
CREATE POLICY "Users can submit reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

-- Admin/moderators can view all reports (for future admin panel)
-- Note: Implement role-based access when admin system is added
CREATE POLICY "Service role can view all reports"
  ON public.reports
  FOR ALL
  USING (auth.role() = 'service_role');

-- Admin/moderators can update report status
CREATE POLICY "Service role can update reports"
  ON public.reports
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reports table
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER VIEWS (Optional - for admin dashboard)
-- ============================================

-- View for report statistics (admin only)
CREATE OR REPLACE VIEW public.report_stats AS
SELECT
  category,
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d
FROM public.reports
GROUP BY category, status;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.blocked_users IS 'Stores user blocking relationships for safety features';
COMMENT ON TABLE public.reports IS 'Stores user reports for harassment, fake profiles, spam, etc.';
COMMENT ON COLUMN public.reports.category IS 'Type of report: harassment, fake, inappropriate, spam, other';
COMMENT ON COLUMN public.reports.status IS 'Report status: pending, reviewed, resolved, dismissed';
COMMENT ON COLUMN public.reports.admin_notes IS 'Internal notes for moderators/admins';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT SELECT, INSERT ON public.reports TO authenticated;

-- Service role has full access (for admin operations)
GRANT ALL ON public.blocked_users TO service_role;
GRANT ALL ON public.reports TO service_role;
