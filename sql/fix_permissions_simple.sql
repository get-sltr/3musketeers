-- Simple fix for get_nearby_profiles permissions
-- Copy and paste this ENTIRE block into Supabase SQL Editor

GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(uuid, double precision, double precision, double precision) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_nearby_profiles(uuid, double precision, double precision, double precision) TO anon;

GRANT EXECUTE ON FUNCTION public.haversine_miles(double precision, double precision, double precision, double precision) TO authenticated;

GRANT EXECUTE ON FUNCTION public.haversine_miles(double precision, double precision, double precision, double precision) TO anon;

