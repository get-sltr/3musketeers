-- Check current policies on profiles table
SELECT 
  tablename, 
  policyname, 
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- Check if there's recursion in any function
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%profiles%'
ORDER BY routine_name;
