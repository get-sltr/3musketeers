-- Database Schema Analysis Based on Audit Results
-- Run this in your Supabase SQL Editor to get detailed schema information

-- =====================================================
-- 1. DETAILED TABLE SCHEMAS
-- =====================================================

-- Get detailed column information for all tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 2. EXISTING CONSTRAINTS AND INDEXES
-- =====================================================

-- Check existing constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tc.table_name, tc.constraint_type;

-- Check existing indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tablename, indexname;

-- =====================================================
-- 3. RLS STATUS CHECK
-- =====================================================

-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED'
    ELSE 'RLS DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tablename;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. STORAGE BUCKET ANALYSIS
-- =====================================================

-- Check storage buckets
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- 5. FUNCTION ANALYSIS
-- =====================================================

-- Check existing functions
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- =====================================================
-- 6. DATA ANALYSIS
-- =====================================================

-- Count records in each table
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
  'conversations' as table_name,
  COUNT(*) as record_count
FROM conversations
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as record_count
FROM messages
UNION ALL
SELECT 
  'albums' as table_name,
  COUNT(*) as record_count
FROM albums
UNION ALL
SELECT 
  'user_sessions' as table_name,
  COUNT(*) as record_count
FROM user_sessions
UNION ALL
SELECT 
  'user_activity_log' as table_name,
  COUNT(*) as record_count
FROM user_activity_log
UNION ALL
SELECT 
  'blocked_users' as table_name,
  COUNT(*) as record_count
FROM blocked_users
UNION ALL
SELECT 
  'reported_users' as table_name,
  COUNT(*) as record_count
FROM reported_users
ORDER BY table_name;
















