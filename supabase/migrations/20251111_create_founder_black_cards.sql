-- ============================================
-- FOUNDER'S BLACK CARD SYSTEM
-- ============================================
-- Purpose: Manage 100 unique Black Cards for Founder's Circle
-- Features: Verification codes, QR codes, redemptions, lifetime access
-- Created: 2025-11-11

-- ============================================
-- FOUNDER CARDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.founder_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_number INTEGER NOT NULL UNIQUE CHECK (founder_number BETWEEN 1 AND 100),
  founder_name TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  verify_url TEXT NOT NULL,
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_founder_cards_verification_code ON public.founder_cards(verification_code);
CREATE INDEX IF NOT EXISTS idx_founder_cards_founder_number ON public.founder_cards(founder_number);
CREATE INDEX IF NOT EXISTS idx_founder_cards_redeemed ON public.founder_cards(redeemed);
CREATE INDEX IF NOT EXISTS idx_founder_cards_user_id ON public.founder_cards(user_id);

-- ============================================
-- VERIFICATION LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_code TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('check', 'redeem')),
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for logs
CREATE INDEX IF NOT EXISTS idx_verification_logs_code ON public.verification_logs(verification_code);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON public.verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON public.verification_logs(created_at DESC);

-- ============================================
-- UPDATE PROFILES TABLE
-- ============================================

-- Add founder-specific columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'member', 'founder')),
  ADD COLUMN IF NOT EXISTS founder_number INTEGER REFERENCES public.founder_cards(founder_number) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS founder_code TEXT,
  ADD COLUMN IF NOT EXISTS lifetime_access BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS founder_joined_at TIMESTAMP WITH TIME ZONE;

-- Index for founder lookups
CREATE INDEX IF NOT EXISTS idx_profiles_founder_number ON public.profiles(founder_number);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.founder_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- Founder Cards Policies

-- Anyone can view active cards (to verify codes)
DROP POLICY IF EXISTS "Anyone can view active founder cards" ON public.founder_cards;
CREATE POLICY "Anyone can view active founder cards"
  ON public.founder_cards
  FOR SELECT
  USING (is_active = true);

-- Only service role can insert/update/delete cards
DROP POLICY IF EXISTS "Service role can manage founder cards" ON public.founder_cards;
CREATE POLICY "Service role can manage founder cards"
  ON public.founder_cards
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Verification Logs Policies

-- Users can view their own verification logs
DROP POLICY IF EXISTS "Users can view their own verification logs" ON public.verification_logs;
CREATE POLICY "Users can view their own verification logs"
  ON public.verification_logs
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Anyone can insert verification logs (for tracking)
DROP POLICY IF EXISTS "Anyone can insert verification logs" ON public.verification_logs;
CREATE POLICY "Anyone can insert verification logs"
  ON public.verification_logs
  FOR INSERT
  WITH CHECK (true);

-- Service role can view all logs
DROP POLICY IF EXISTS "Service role can view all logs" ON public.verification_logs;
CREATE POLICY "Service role can view all logs"
  ON public.verification_logs
  FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_founder_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for founder_cards updated_at
DROP TRIGGER IF EXISTS founder_cards_updated_at ON public.founder_cards;
CREATE TRIGGER founder_cards_updated_at
  BEFORE UPDATE ON public.founder_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_founder_cards_updated_at();

-- ============================================
-- HELPER FUNCTIONS FOR ANALYTICS
-- ============================================

-- Get redemption statistics
CREATE OR REPLACE FUNCTION public.get_founder_card_stats()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total', COUNT(*),
      'redeemed', COUNT(*) FILTER (WHERE redeemed = TRUE),
      'available', COUNT(*) FILTER (WHERE redeemed = FALSE),
      'redemption_rate', ROUND(
        100.0 * COUNT(*) FILTER (WHERE redeemed = TRUE) / NULLIF(COUNT(*), 0),
        2
      ),
      'most_recent_redemption', (
        SELECT json_build_object(
          'founder_name', founder_name,
          'founder_number', founder_number,
          'redeemed_at', redeemed_at
        )
        FROM public.founder_cards
        WHERE redeemed = TRUE
        ORDER BY redeemed_at DESC
        LIMIT 1
      )
    )
    FROM public.founder_cards
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.founder_cards IS 'Stores 100 unique Black Cards for Founder''s Circle members with lifetime access';
COMMENT ON TABLE public.verification_logs IS 'Audit trail of all verification attempts and redemptions';
COMMENT ON COLUMN public.founder_cards.verification_code IS 'Unique code format: SLTR-FC-XXXX-XXXX';
COMMENT ON COLUMN public.founder_cards.verify_url IS 'Full URL to verification page for QR code';
COMMENT ON COLUMN public.profiles.tier IS 'User tier: free, member, or founder';
COMMENT ON COLUMN public.profiles.lifetime_access IS 'Founders get lifetime premium access';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Authenticated users can read founder cards (to verify)
GRANT SELECT ON public.founder_cards TO authenticated;
GRANT SELECT ON public.founder_cards TO anon;

-- Authenticated users can insert verification logs
GRANT INSERT ON public.verification_logs TO authenticated;
GRANT INSERT ON public.verification_logs TO anon;

-- Service role has full access
GRANT ALL ON public.founder_cards TO service_role;
GRANT ALL ON public.verification_logs TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary:
-- ✅ founder_cards table (100 unique cards)
-- ✅ verification_logs table (audit trail)
-- ✅ Updated profiles table (founder columns)
-- ✅ RLS policies (secure access)
-- ✅ Helper functions (analytics)
-- ✅ Indexes (performance)
--
-- Next Steps:
-- 1. Run: node scripts/generate_black_cards.js
-- 2. Run: node scripts/import_to_supabase.js
-- 3. Deploy verification pages and API
-- ============================================
