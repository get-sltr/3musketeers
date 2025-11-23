-- Fix get_nearby_profiles permissions - CORRECTED VERSION
-- Run this in Supabase SQL Editor
-- Date: 2025-11-21

-- First, verify the functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('get_nearby_profiles', 'haversine_miles');

-- Grant execute permissions on get_nearby_profiles function
-- Function signature: get_nearby_profiles(p_user_id uuid, p_origin_lat double precision, p_origin_lon double precision, p_radius_miles double precision)
GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(uuid, double precision, double precision, double precision) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(uuid, double precision, double precision, double precision) TO anon;

-- Grant execute permissions on haversine_miles helper function  
-- Function signature: haversine_miles(p_lat1 double precision, p_lon1 double precision, p_lat2 double precision, p_lon2 double precision)
GRANT EXECUTE ON FUNCTION public.haversine_miles(double precision, double precision, double precision, double precision) TO authenticated;

GRANT EXECUTE ON FUNCTION public.haversine_miles(double precision, double precision, double precision, double precision) TO anon;

