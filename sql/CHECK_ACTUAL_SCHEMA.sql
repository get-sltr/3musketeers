-- FIRST: Check actual schema of blocked_users table
-- Run this FIRST to see what columns actually exist in your database

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'blocked_users'
ORDER BY ordinal_position;

-- If table doesn't exist at all, you'll get no results
-- If it exists but has different columns, you'll see what it actually has

-- ALSO: Check if is_user_blocked function exists and what it does
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_user_blocked';

