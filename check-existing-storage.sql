-- Check existing storage policies BEFORE creating new ones
-- Run this in your Supabase SQL Editor

-- Check what storage policies already exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
ORDER BY policyname;

-- Also check what storage buckets already exist
SELECT 
  id,
  name,
  public,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY id;















