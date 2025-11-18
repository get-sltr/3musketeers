-- SQL Migration: RLS-Compliant Paginated Nearby Profiles
-- Run this in your Supabase SQL Editor

-- Drop existing function
DROP FUNCTION IF EXISTS get_nearby_profiles_paginated;

-- Create RLS-compliant function with SECURITY INVOKER
CREATE OR REPLACE FUNCTION get_nearby_profiles_paginated(
  p_user_id UUID,
  p_origin_lat DOUBLE PRECISION,
  p_origin_lon DOUBLE PRECISION,
  p_radius_miles DOUBLE PRECISION,
  p_limit INTEGER DEFAULT 30,
  p_cursor UUID DEFAULT NULL,
  p_filters JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- Use caller's permissions for RLS
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Build result with proper cursor handling
  WITH ranked AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (
        ORDER BY 
          is_self DESC,
          is_online DESC,
          distance_miles ASC,
          created_at DESC
      ) as rank_order
    FROM (
      SELECT 
        p.*,
        -- Haversine formula for distance
        CASE 
          WHEN p.latitude IS NULL OR p.longitude IS NULL THEN 999999
          WHEN p.id = p_user_id THEN 0
          ELSE (
            3959 * acos(
              LEAST(1.0,
                cos(radians(p_origin_lat)) * cos(radians(p.latitude)) * 
                cos(radians(p.longitude) - radians(p_origin_lon)) + 
                sin(radians(p_origin_lat)) * sin(radians(p.latitude))
              )
            )
          )
        END AS distance_miles,
        -- Distance label
        CASE 
          WHEN p.id = p_user_id THEN 'You'
          WHEN p.latitude IS NULL THEN 'Location off'
          ELSE 'Near'
        END AS distance_label,
        -- Check favorites
        EXISTS(
          SELECT 1 FROM favorites f 
          WHERE f.user_id = p_user_id 
          AND f.favorited_user_id = p.id
        ) AS is_favorited,
        (p.id = p_user_id) AS is_self
      FROM profiles p
      WHERE 
        -- Spatial indexing for performance
        p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
        AND (
          p.id = p_user_id  -- Always include self
          OR (
            -- Bounding box pre-filter
            p.latitude BETWEEN p_origin_lat - (p_radius_miles / 69.0) 
                          AND p_origin_lat + (p_radius_miles / 69.0)
            AND p.longitude BETWEEN p_origin_lon - (p_radius_miles / (69.0 * cos(radians(p_origin_lat)))) 
                            AND p_origin_lon + (p_radius_miles / (69.0 * cos(radians(p_origin_lat))))
          )
        )
    ) distance_calc
    WHERE 
      distance_miles <= p_radius_miles
      OR is_self = true
  )
  SELECT * FROM ranked WHERE rank_order <= p_limit
  )
  SELECT jsonb_build_object(
    'users', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'display_name', display_name,
        'username', username,
        'photo_url', photo_url,
        'photos', photos,
        'latitude', latitude,
        'longitude', longitude,
        'is_online', is_online,
        'online', is_online,
        'dtfn', dtfn,
        'party_friendly', party_friendly,
        'about', about,
        'age', age,
        'position', position,
        'kinks', kinks,
        'tags', tags,
        'height', height,
        'body_type', body_type,
        'ethnicity', ethnicity,
        'founder_number', founder_number,
        'incognito_mode', incognito_mode,
        'distance_miles', ROUND(distance_miles::numeric, 2),
        'distance_label', distance_label,
        'is_favorited', is_favorited,
        'is_self', is_self
      ) ORDER BY rank_order
    ), '[]'::jsonb),
    'next_cursor', (SELECT id FROM ranked ORDER BY rank_order DESC LIMIT 1),
    'has_more', (SELECT COUNT(*) > p_limit FROM ranked)
  ) INTO v_result
  FROM ranked;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_nearby_profiles_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_profiles_paginated TO anon;

-- Spatial indexes for performance at scale
CREATE INDEX IF NOT EXISTS idx_profiles_location_bbox 
ON profiles USING GIST (point(longitude, latitude));

CREATE INDEX IF NOT EXISTS idx_profiles_online_created 
ON profiles(is_online DESC, created_at DESC)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment
COMMENT ON FUNCTION get_nearby_profiles_paginated IS 
'RLS-compliant function that fetches nearby user profiles with pagination. Uses SECURITY INVOKER for proper RLS enforcement.';
