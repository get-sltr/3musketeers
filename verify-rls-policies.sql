-- RLS Policies Verification Script
-- Run this in your Supabase SQL Editor to check if Step 2 policies are properly implemented

-- =====================================================
-- 1. CHECK RLS STATUS ON ALL TABLES
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tablename;

-- =====================================================
-- 2. CHECK EXISTING POLICIES
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 READ'
    WHEN cmd = 'INSERT' THEN '➕ CREATE'
    WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
    WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
    ELSE cmd
  END as operation
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- 3. CHECK SECURITY FUNCTIONS
-- =====================================================

SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  CASE 
    WHEN routine_name = 'is_user_blocked' THEN '✅ User blocking check'
    WHEN routine_name = 'log_user_activity' THEN '✅ Activity logging'
    ELSE '❓ Unknown function'
  END as description
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('is_user_blocked', 'log_user_activity')
ORDER BY routine_name;

-- =====================================================
-- 4. POLICY COUNT SUMMARY
-- =====================================================

SELECT 
  tablename,
  COUNT(*) as policy_count,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as read_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as create_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 5. EXPECTED VS ACTUAL POLICY CHECK
-- =====================================================

-- Expected policies for each table
WITH expected_policies AS (
  SELECT 'profiles' as table_name, 'Users can view their own profile' as policy_name, 'SELECT' as cmd
  UNION ALL SELECT 'profiles', 'Users can view other profiles', 'SELECT'
  UNION ALL SELECT 'profiles', 'Users can update their own profile', 'UPDATE'
  UNION ALL SELECT 'profiles', 'Users can insert their own profile', 'INSERT'
  UNION ALL SELECT 'conversations', 'Users can view their own conversations', 'SELECT'
  UNION ALL SELECT 'conversations', 'Users can create conversations', 'INSERT'
  UNION ALL SELECT 'conversations', 'Users can update their own conversations', 'UPDATE'
  UNION ALL SELECT 'messages', 'Users can view messages in their conversations', 'SELECT'
  UNION ALL SELECT 'messages', 'Users can send messages in their conversations', 'INSERT'
  UNION ALL SELECT 'messages', 'Users can update their own messages', 'UPDATE'
  UNION ALL SELECT 'messages', 'Users can delete their own messages', 'DELETE'
  UNION ALL SELECT 'user_sessions', 'Users can view their own sessions', 'SELECT'
  UNION ALL SELECT 'user_sessions', 'Users can create their own sessions', 'INSERT'
  UNION ALL SELECT 'user_sessions', 'Users can update their own sessions', 'UPDATE'
  UNION ALL SELECT 'user_sessions', 'Users can delete their own sessions', 'DELETE'
  UNION ALL SELECT 'user_activity_log', 'Users can view their own activity', 'SELECT'
  UNION ALL SELECT 'user_activity_log', 'System can insert activity logs', 'INSERT'
  UNION ALL SELECT 'blocked_users', 'Users can view their own blocks', 'SELECT'
  UNION ALL SELECT 'blocked_users', 'Users can block other users', 'INSERT'
  UNION ALL SELECT 'blocked_users', 'Users can unblock users', 'DELETE'
  UNION ALL SELECT 'reported_users', 'Users can view their own reports', 'SELECT'
  UNION ALL SELECT 'reported_users', 'Users can report other users', 'INSERT'
),
actual_policies AS (
  SELECT tablename, policyname, cmd
  FROM pg_policies 
  WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
)
SELECT 
  e.table_name,
  e.policy_name,
  e.cmd,
  CASE 
    WHEN a.policyname IS NOT NULL THEN '✅ IMPLEMENTED'
    ELSE '❌ MISSING'
  END as status
FROM expected_policies e
LEFT JOIN actual_policies a ON e.table_name = a.tablename AND e.policy_name = a.policyname AND e.cmd = a.cmd
ORDER BY e.table_name, e.cmd, e.policy_name;
















