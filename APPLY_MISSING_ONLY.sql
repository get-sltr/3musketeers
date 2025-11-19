-- ============================================
-- CHECK WHAT EXISTS
-- ============================================

-- Check if favorites table exists
SELECT 'favorites' as table_name, EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'favorites'
) as exists;

-- Check if subscription columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('subscription_tier', 'subscription_expires_at', 'is_super_admin');

-- ============================================
-- APPLY ONLY WHAT'S MISSING
-- ============================================

-- 1. CREATE FAVORITES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, favorited_user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favorited_user_id ON public.favorites(favorited_user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
CREATE POLICY "Users can insert their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
CREATE POLICY "Users can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

-- 2. FIX ONLINE STATUS FUNCTION
CREATE OR REPLACE FUNCTION public.get_nearby_profiles(
  p_user_id uuid,
  p_origin_lat double precision,
  p_origin_lon double precision,
  p_radius_miles double precision default 25
)
RETURNS TABLE (
  id uuid,
  display_name text,
  photo_url text,
  photos text[],
  is_online boolean,
  dtfn boolean,
  party_friendly boolean,
  latitude double precision,
  longitude double precision,
  founder_number integer,
  about text,
  kinks text[],
  tags text[],
  "position" text,
  age integer,
  incognito_mode boolean,
  distance_miles double precision,
  is_self boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH origin AS (
    SELECT p_origin_lat AS lat, p_origin_lon AS lon, COALESCE(NULLIF(p_radius_miles, 0), 1)::double precision AS radius
  )
  SELECT
    prof.id,
    prof.display_name,
    prof.photo_url,
    CASE
      WHEN jsonb_typeof(prof.photos) = 'array'
      THEN (SELECT array_agg(value::text) FROM jsonb_array_elements_text(prof.photos))
      ELSE ARRAY[]::text[]
    END AS photos,
    prof.online AS is_online,
    prof.dtfn,
    prof.party_friendly,
    prof.latitude,
    prof.longitude,
    prof.founder_number,
    prof.about,
    prof.kinks,
    prof.tags,
    prof."position",
    prof.age,
    prof.incognito_mode,
    public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude) AS distance_miles,
    prof.id = p_user_id AS is_self
  FROM public.profiles prof
  CROSS JOIN origin
  LEFT JOIN public.blocks b1
    ON b1.blocker_id = p_user_id
   AND b1.blocked_id = prof.id
  LEFT JOIN public.blocks b2
    ON b2.blocker_id = prof.id
   AND b2.blocked_id = p_user_id
  WHERE prof.latitude IS NOT NULL
    AND prof.longitude IS NOT NULL
    AND COALESCE(prof.incognito_mode, false) = false
    AND b1.blocked_id IS NULL
    AND b2.blocker_id IS NULL
    AND (
      prof.id = p_user_id
      OR public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude) <= origin.radius
    )
  ORDER BY
    CASE WHEN prof.id = p_user_id THEN 0 ELSE 1 END,
    public.haversine_miles(origin.lat, origin.lon, prof.latitude, prof.longitude)
  LIMIT 500;
$function$;

-- 3. SET SUPER ADMIN
UPDATE profiles 
SET is_super_admin = true 
WHERE email = 'kminn121@gmail.com';

-- 4. VERIFY EVERYTHING
SELECT 
  email,
  is_super_admin,
  subscription_tier,
  founder_number
FROM profiles 
WHERE email = 'kminn121@gmail.com';

-- Check favorites table
SELECT COUNT(*) as favorites_count FROM favorites;

-- Done!
SELECT '✅ All updates applied successfully!' as status;
