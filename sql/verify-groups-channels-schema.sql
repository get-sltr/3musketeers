-- Verification Script: Groups & Channels Schema
-- Purpose: Validate that groups and channels tables are correctly configured
-- Run this after applying migration 20251128_fix_groups_schema_conflict.sql

\echo '============================================'
\echo 'GROUPS & CHANNELS SCHEMA VERIFICATION'
\echo '============================================'
\echo ''

-- ============================================================================
-- 1. TABLE EXISTENCE
-- ============================================================================
\echo '1. Checking table existence...'
\echo ''

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups')
    THEN '✓ groups table exists'
    ELSE '✗ groups table MISSING'
  END AS groups_table;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members')
    THEN '✓ group_members table exists'
    ELSE '✗ group_members table MISSING'
  END AS group_members_table;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_messages')
    THEN '✓ group_messages table exists'
    ELSE '✗ group_messages table MISSING'
  END AS group_messages_table;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channels')
    THEN '✓ channels table exists'
    ELSE '✗ channels table MISSING'
  END AS channels_table;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channel_messages')
    THEN '✓ channel_messages table exists'
    ELSE '✗ channel_messages table MISSING'
  END AS channel_messages_table;

\echo ''

-- ============================================================================
-- 2. GROUPS TABLE SCHEMA
-- ============================================================================
\echo '2. Checking groups table columns...'
\echo ''

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE
    WHEN column_name IN ('id', 'name', 'title', 'description', 'owner_id', 'host_id', 'created_at', 'updated_at')
    THEN '✓'
    ELSE '?'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'groups'
ORDER BY ordinal_position;

\echo ''

-- Check for REQUIRED columns
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'name')
    THEN '✓ name column exists'
    ELSE '✗ name column MISSING'
  END AS name_col,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'title')
    THEN '✓ title column exists'
    ELSE '✗ title column MISSING'
  END AS title_col,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'owner_id')
    THEN '✓ owner_id column exists'
    ELSE '✗ owner_id column MISSING'
  END AS owner_id_col,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'host_id')
    THEN '✓ host_id column exists'
    ELSE '✗ host_id column MISSING'
  END AS host_id_col;

\echo ''

-- ============================================================================
-- 3. FOREIGN KEY CONSTRAINTS
-- ============================================================================
\echo '3. Checking foreign key constraints...'
\echo ''

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS foreign_table,
  af.attname AS foreign_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND conrelid::regclass::text IN ('groups', 'channels', 'group_members', 'group_messages', 'channel_messages')
ORDER BY conrelid::regclass::text, conname;

\echo ''

-- ============================================================================
-- 4. INDEXES
-- ============================================================================
\echo '4. Checking indexes...'
\echo ''

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'channels', 'group_members', 'group_messages', 'channel_messages')
ORDER BY tablename, indexname;

\echo ''

-- ============================================================================
-- 5. RLS STATUS
-- ============================================================================
\echo '5. Checking Row Level Security (RLS)...'
\echo ''

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'channels', 'group_members', 'group_messages', 'channel_messages')
ORDER BY tablename;

\echo ''

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================
\echo '6. Checking RLS policies...'
\echo ''

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'channels', 'group_members', 'group_messages', 'channel_messages')
ORDER BY tablename, policyname;

\echo ''

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================
\echo '7. Checking triggers...'
\echo ''

SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid::regclass::text IN ('groups', 'channels', 'group_members', 'group_messages')
  AND NOT tgisinternal
ORDER BY tgrelid::regclass::text, tgname;

\echo ''

-- Verify sync trigger specifically
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_groups_columns_trigger')
    THEN '✓ sync_groups_columns_trigger exists'
    ELSE '✗ sync_groups_columns_trigger MISSING'
  END AS sync_trigger_status;

\echo ''

-- ============================================================================
-- 8. DATA CONSISTENCY
-- ============================================================================
\echo '8. Checking data consistency...'
\echo ''

-- Check for groups with mismatched name/title
SELECT
  COUNT(*) AS mismatched_name_title,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ All name/title columns in sync'
    ELSE '⚠ Some groups have mismatched name/title'
  END AS status
FROM public.groups
WHERE (name IS NOT NULL AND title IS NULL)
   OR (name IS NULL AND title IS NOT NULL)
   OR (name IS NOT NULL AND title IS NOT NULL AND name != title);

-- Check for groups with mismatched owner_id/host_id
SELECT
  COUNT(*) AS mismatched_owner_host,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ All owner_id/host_id columns in sync'
    ELSE '⚠ Some groups have mismatched owner_id/host_id'
  END AS status
FROM public.groups
WHERE (owner_id IS NOT NULL AND host_id IS NULL)
   OR (owner_id IS NULL AND host_id IS NOT NULL)
   OR (owner_id IS NOT NULL AND host_id IS NOT NULL AND owner_id != host_id);

\echo ''

-- ============================================================================
-- 9. TEST QUERIES (Application Code Patterns)
-- ============================================================================
\echo '9. Testing application query patterns...'
\echo ''

-- Test query with host_id (used by setup-club API)
\echo 'Pattern 1: SELECT using host_id filter'
EXPLAIN (FORMAT TEXT, COSTS OFF)
SELECT id, name, description, host_id, created_at
FROM public.groups
WHERE host_id = '00000000-0000-0000-0000-000000000000'::uuid;

\echo ''
\echo 'Pattern 2: SELECT using owner_id filter'
EXPLAIN (FORMAT TEXT, COSTS OFF)
SELECT id, name, description, owner_id, created_at
FROM public.groups
WHERE owner_id = '00000000-0000-0000-0000-000000000000'::uuid;

\echo ''
\echo 'Pattern 3: JOIN groups with channels (used by group detail page)'
EXPLAIN (FORMAT TEXT, COSTS OFF)
SELECT g.id, g.name, g.title, c.id AS channel_id, c.name AS channel_name, c.type
FROM public.groups g
LEFT JOIN public.channels c ON c.group_id = g.id
WHERE g.id = '00000000-0000-0000-0000-000000000000'::uuid;

\echo ''

-- ============================================================================
-- 10. SUMMARY
-- ============================================================================
\echo '============================================'
\echo 'SUMMARY'
\echo '============================================'

SELECT
  'Groups Table' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'groups'
      AND column_name IN ('name', 'title', 'owner_id', 'host_id')
    )
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status
UNION ALL
SELECT
  'Channels Table' AS check_item,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channels')
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status
UNION ALL
SELECT
  'RLS Enabled' AS check_item,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('groups', 'channels') AND rowsecurity = true) = 2
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status
UNION ALL
SELECT
  'RLS Policies' AS check_item,
  CASE
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('groups', 'channels')) >= 6
    THEN '✓ PASS'
    ELSE '⚠ WARNING - Check policies'
  END AS status
UNION ALL
SELECT
  'Sync Trigger' AS check_item,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_groups_columns_trigger')
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END AS status;

\echo ''
\echo '✅ Verification complete!'
\echo ''
