-- Add is_super_admin column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin
ON public.profiles(is_super_admin)
WHERE is_super_admin = true;

-- Create admin_analytics view for tracking user registrations and activity
CREATE OR REPLACE VIEW public.admin_analytics AS
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS users_last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS users_last_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS users_last_month,
  COUNT(*) FILTER (WHERE is_online = true) AS users_online_now,
  COUNT(*) FILTER (WHERE photo_url IS NOT NULL) AS users_with_photos,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS users_with_location,
  AVG(EXTRACT(YEAR FROM AGE(NOW(), created_at))) AS avg_account_age_years
FROM public.profiles;

-- Create function to get recent registrations (for super admin only)
CREATE OR REPLACE FUNCTION public.get_recent_registrations(
  p_admin_id UUID,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ,
  is_online BOOLEAN,
  founder_number INT,
  latitude FLOAT,
  longitude FLOAT
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

  -- Return recent registrations
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.photo_url,
    p.created_at,
    p.is_online,
    p.founder_number,
    p.latitude,
    p.longitude
  FROM public.profiles p
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Create function to get user statistics (for super admin only)
CREATE OR REPLACE FUNCTION public.get_user_statistics(
  p_admin_id UUID
)
RETURNS TABLE (
  stat_name TEXT,
  stat_value BIGINT
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

  -- Return statistics
  RETURN QUERY
  SELECT 'Total Users'::TEXT, COUNT(*)::BIGINT FROM public.profiles
  UNION ALL
  SELECT 'New Today'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE created_at >= CURRENT_DATE
  UNION ALL
  SELECT 'New This Week'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  UNION ALL
  SELECT 'New This Month'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  UNION ALL
  SELECT 'Online Now'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE is_online = true
  UNION ALL
  SELECT 'With Photos'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE photo_url IS NOT NULL
  UNION ALL
  SELECT 'With Location'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  UNION ALL
  SELECT 'Verified Founders'::TEXT, COUNT(*)::BIGINT FROM public.profiles WHERE founder_number IS NOT NULL;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.admin_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_registrations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics TO authenticated;

COMMENT ON COLUMN public.profiles.is_super_admin IS 'Super admin flag - grants access to admin dashboard and analytics';
COMMENT ON FUNCTION public.get_recent_registrations IS 'Returns recent user registrations (super admin only)';
COMMENT ON FUNCTION public.get_user_statistics IS 'Returns user statistics (super admin only)';
