-- Fix get_nearby_profiles permissions
-- This migration ensures the function can be executed by authenticated users
-- Date: 2025-11-21

-- Grant execute permissions on get_nearby_profiles function
GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(uuid, double precision, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(uuid, double precision, double precision, double precision) TO anon;

-- Grant execute permissions on haversine_miles helper function
GRANT EXECUTE ON FUNCTION public.haversine_miles(double precision, double precision, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.haversine_miles(double precision, double precision, double precision, double precision) TO anon;

