-- Check blocked_users table schema
-- Run this in your Supabase SQL Editor to see the actual columns

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'blocked_users'
ORDER BY ordinal_position;














