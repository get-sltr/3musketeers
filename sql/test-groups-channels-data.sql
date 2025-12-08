-- Test Data Script: Groups & Channels
-- Purpose: Create test data to validate schema fix
-- Run this AFTER applying migration 20251128_fix_groups_schema_conflict.sql
-- WARNING: This creates test data - use in development only!

\echo '============================================'
\echo 'GROUPS & CHANNELS TEST DATA CREATION'
\echo '============================================'
\echo ''

-- ============================================================================
-- SETUP: Get or create test user
-- ============================================================================
\echo '1. Setting up test user...'

-- You'll need to replace this with an actual user UUID from your auth.users table
-- Or create a test user first via Supabase Auth
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Try to get first user from auth.users
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠ No users found in auth.users table';
    RAISE NOTICE 'Please create a user first via Supabase Auth or provide a valid user UUID';
    RAISE EXCEPTION 'Cannot proceed without a valid user';
  ELSE
    RAISE NOTICE '✓ Using test user: %', test_user_id;
    -- Store in temporary table for use in subsequent queries
    CREATE TEMP TABLE IF NOT EXISTS test_config (key TEXT, value TEXT);
    DELETE FROM test_config WHERE key = 'user_id';
    INSERT INTO test_config (key, value) VALUES ('user_id', test_user_id::TEXT);
  END IF;
END $$;

\echo ''

-- ============================================================================
-- TEST 1: Create group using host_id (Migration 2 pattern)
-- ============================================================================
\echo '2. TEST 1: Creating group with host_id...'

DO $$
DECLARE
  test_user_id UUID;
  new_group_id UUID;
BEGIN
  SELECT value::UUID INTO test_user_id FROM test_config WHERE key = 'user_id';

  INSERT INTO public.groups (name, description, host_id)
  VALUES (
    'Test Group (host_id)',
    'This group was created using host_id column',
    test_user_id
  )
  RETURNING id INTO new_group_id;

  -- Verify sync trigger worked
  IF EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = new_group_id
    AND host_id = owner_id
    AND name = title
  ) THEN
    RAISE NOTICE '✓ Group created successfully with host_id';
    RAISE NOTICE '✓ Sync trigger worked: owner_id = host_id, name = title';
  ELSE
    RAISE WARNING '⚠ Sync trigger may not be working correctly';
  END IF;

  -- Store for later use
  INSERT INTO test_config (key, value) VALUES ('group1_id', new_group_id::TEXT);
END $$;

\echo ''

-- ============================================================================
-- TEST 2: Create group using owner_id (Migration 1 pattern)
-- ============================================================================
\echo '3. TEST 2: Creating group with owner_id...'

DO $$
DECLARE
  test_user_id UUID;
  new_group_id UUID;
BEGIN
  SELECT value::UUID INTO test_user_id FROM test_config WHERE key = 'user_id';

  INSERT INTO public.groups (name, description, owner_id, is_private, max_members)
  VALUES (
    'Test Group (owner_id)',
    'This group was created using owner_id column',
    test_user_id,
    false,
    25
  )
  RETURNING id INTO new_group_id;

  -- Verify sync trigger worked
  IF EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = new_group_id
    AND host_id = owner_id
    AND name = title
  ) THEN
    RAISE NOTICE '✓ Group created successfully with owner_id';
    RAISE NOTICE '✓ Sync trigger worked: host_id = owner_id, name = title';
  ELSE
    RAISE WARNING '⚠ Sync trigger may not be working correctly';
  END IF;

  -- Store for later use
  INSERT INTO test_config (key, value) VALUES ('group2_id', new_group_id::TEXT);
END $$;

\echo ''

-- ============================================================================
-- TEST 3: Create "The Club sltr" (Application pattern)
-- ============================================================================
\echo '4. TEST 3: Creating "The Club sltr" group...'

DO $$
DECLARE
  test_user_id UUID;
  club_group_id UUID;
BEGIN
  SELECT value::UUID INTO test_user_id FROM test_config WHERE key = 'user_id';

  -- Check if already exists
  SELECT id INTO club_group_id FROM public.groups WHERE name = 'The Club sltr' LIMIT 1;

  IF club_group_id IS NOT NULL THEN
    RAISE NOTICE '⚠ The Club sltr already exists with id: %', club_group_id;
  ELSE
    INSERT INTO public.groups (name, description, host_id)
    VALUES (
      'The Club sltr',
      'The premier club for video conferencing, voice chats, and messaging. Connect, chat, and vibe with the community!',
      test_user_id
    )
    RETURNING id INTO club_group_id;

    RAISE NOTICE '✓ The Club sltr created successfully';
  END IF;

  -- Store for later use
  DELETE FROM test_config WHERE key = 'club_id';
  INSERT INTO test_config (key, value) VALUES ('club_id', club_group_id::TEXT);
END $$;

\echo ''

-- ============================================================================
-- TEST 4: Create channels for groups
-- ============================================================================
\echo '5. TEST 4: Creating channels...'

DO $$
DECLARE
  test_user_id UUID;
  group1_id UUID;
  club_id UUID;
  channel_id UUID;
BEGIN
  SELECT value::UUID INTO test_user_id FROM test_config WHERE key = 'user_id';
  SELECT value::UUID INTO group1_id FROM test_config WHERE key = 'group1_id';
  SELECT value::UUID INTO club_id FROM test_config WHERE key = 'club_id';

  -- Create text channel for group1
  INSERT INTO public.channels (group_id, name, description, type, created_by)
  VALUES (
    group1_id,
    'General',
    'General discussion',
    'text',
    test_user_id
  )
  RETURNING id INTO channel_id;
  RAISE NOTICE '✓ Text channel created for group1: %', channel_id;

  -- Create voice channel for group1
  INSERT INTO public.channels (group_id, name, description, type, created_by)
  VALUES (
    group1_id,
    'Voice Chat',
    'Join voice call',
    'voice',
    test_user_id
  )
  RETURNING id INTO channel_id;
  RAISE NOTICE '✓ Voice channel created for group1: %', channel_id;

  -- Create video channel for group1
  INSERT INTO public.channels (group_id, name, description, type, created_by)
  VALUES (
    group1_id,
    'Video Room',
    'Join video call',
    'video',
    test_user_id
  )
  RETURNING id INTO channel_id;
  RAISE NOTICE '✓ Video channel created for group1: %', channel_id;

  -- Create channels for The Club sltr
  INSERT INTO public.channels (group_id, name, description, type, created_by)
  VALUES
    (club_id, 'The Club P''n''P', 'Video conferencing room - Party and Play', 'video', test_user_id),
    (club_id, 'The Club P''n''P Voice', 'Voice chat room - Party and Play', 'voice', test_user_id),
    (club_id, 'The Club P''n''P Chat', 'Text chat room - Party and Play', 'text', test_user_id),
    (club_id, 'The Club H''n''H', 'Video conferencing room - High and Horny', 'video', test_user_id),
    (club_id, 'The Club H''n''H Voice', 'Voice chat room - High and Horny', 'voice', test_user_id),
    (club_id, 'The Club H''n''H Chat', 'Text chat room - High and Horny', 'text', test_user_id),
    (club_id, 'The Club Smoke N'' Stroke', 'Video conferencing room - Smoke and Stroke', 'video', test_user_id),
    (club_id, 'The Club Smoke N'' Stroke Voice', 'Voice chat room - Smoke and Stroke', 'voice', test_user_id),
    (club_id, 'The Club Smoke N'' Stroke Chat', 'Text chat room - Smoke and Stroke', 'text', test_user_id);

  RAISE NOTICE '✓ All channels created for The Club sltr';
END $$;

\echo ''

-- ============================================================================
-- TEST 5: Add group members
-- ============================================================================
\echo '6. TEST 5: Adding group members...'

DO $$
DECLARE
  test_user_id UUID;
  group1_id UUID;
  group2_id UUID;
BEGIN
  SELECT value::UUID INTO test_user_id FROM test_config WHERE key = 'user_id';
  SELECT value::UUID INTO group1_id FROM test_config WHERE key = 'group1_id';
  SELECT value::UUID INTO group2_id FROM test_config WHERE key = 'group2_id';

  -- Note: The trigger add_group_owner() should have already added the owner
  -- Check if members were auto-added
  IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group1_id AND user_id = test_user_id) THEN
    RAISE NOTICE '✓ Owner automatically added to group1 as member via trigger';
  ELSE
    RAISE WARNING '⚠ Owner was NOT automatically added to group1 - trigger may not be working';
  END IF;

  IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group2_id AND user_id = test_user_id) THEN
    RAISE NOTICE '✓ Owner automatically added to group2 as member via trigger';
  ELSE
    RAISE WARNING '⚠ Owner was NOT automatically added to group2 - trigger may not be working';
  END IF;
END $$;

\echo ''

-- ============================================================================
-- TEST 6: Create test messages
-- ============================================================================
\echo '7. TEST 6: Creating test messages...'

DO $$
DECLARE
  test_user_id UUID;
  group1_id UUID;
BEGIN
  SELECT value::UUID INTO test_user_id FROM test_config WHERE key = 'user_id';
  SELECT value::UUID INTO group1_id FROM test_config WHERE key = 'group1_id';

  -- Add test messages
  INSERT INTO public.group_messages (group_id, sender_id, content)
  VALUES
    (group1_id, test_user_id, 'Hello! This is a test message.'),
    (group1_id, test_user_id, 'Testing the groups functionality after schema fix.'),
    (group1_id, test_user_id, 'Everything looks good! 🎉');

  RAISE NOTICE '✓ Test messages created';
END $$;

\echo ''

-- ============================================================================
-- VERIFICATION: Display created test data
-- ============================================================================
\echo '============================================'
\echo 'TEST DATA CREATED - VERIFICATION'
\echo '============================================'
\echo ''

\echo 'Groups created:'
SELECT
  id,
  name,
  title,
  description,
  owner_id,
  host_id,
  CASE
    WHEN owner_id = host_id AND name = title THEN '✓ Synced'
    ELSE '✗ NOT synced'
  END AS sync_status,
  created_at
FROM public.groups
ORDER BY created_at DESC;

\echo ''
\echo 'Channels created:'
SELECT
  c.id,
  c.name,
  c.type,
  g.name AS group_name,
  c.created_at
FROM public.channels c
JOIN public.groups g ON g.id = c.group_id
ORDER BY g.name, c.type, c.name;

\echo ''
\echo 'Group members:'
SELECT
  gm.id,
  g.name AS group_name,
  gm.role,
  gm.joined_at
FROM public.group_members gm
JOIN public.groups g ON g.id = gm.group_id
ORDER BY g.name, gm.role;

\echo ''
\echo 'Group messages:'
SELECT
  gm.id,
  g.name AS group_name,
  gm.content,
  gm.created_at
FROM public.group_messages gm
JOIN public.groups g ON g.id = gm.group_id
ORDER BY g.name, gm.created_at;

\echo ''

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo '============================================'
\echo 'TEST DATA SUMMARY'
\echo '============================================'

SELECT
  (SELECT COUNT(*) FROM public.groups) AS total_groups,
  (SELECT COUNT(*) FROM public.channels) AS total_channels,
  (SELECT COUNT(*) FROM public.group_members) AS total_members,
  (SELECT COUNT(*) FROM public.group_messages) AS total_messages;

\echo ''

-- Check sync status
SELECT
  COUNT(*) AS synced_groups,
  CASE
    WHEN COUNT(*) = (SELECT COUNT(*) FROM public.groups) THEN '✓ ALL groups properly synced'
    ELSE '⚠ Some groups not synced'
  END AS status
FROM public.groups
WHERE owner_id = host_id AND name = title;

\echo ''
\echo '✅ Test data creation complete!'
\echo ''
\echo 'Next steps:'
\echo '1. Test group creation via UI at /groups'
\echo '2. Test channel creation via UI at /groups/channels'
\echo '3. Test "The Club sltr" setup via API: POST /api/groups/setup-club'
\echo '4. Test group detail page at /groups/[id]'
\echo ''

-- Cleanup temp table
DROP TABLE IF EXISTS test_config;
