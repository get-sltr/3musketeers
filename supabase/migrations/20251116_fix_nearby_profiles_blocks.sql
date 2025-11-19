-- Update get_nearby_profiles to correctly filter blocked users using the blocks table
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
  -- Filter out users that the current user has blocked
  LEFT JOIN public.blocks b1
    ON b1.blocker_id = p_user_id
   AND b1.blocked_id = prof.id
  -- Filter out users who have blocked the current user
  LEFT JOIN public.blocks b2
    ON b2.blocker_id = prof.id
   AND b2.blocked_id = p_user_id
  WHERE prof.latitude IS NOT NULL
    AND prof.longitude IS NOT NULL
    AND COALESCE(prof.incognito_mode, false) = false
    -- Exclude blocked users (both ways)
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

COMMENT ON FUNCTION public.get_nearby_profiles IS
  'Return profiles (excluding blocked/incognito) within the specified radius of the origin coordinates, including distance in miles.';
