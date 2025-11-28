-- Migration: Fix groups table schema conflicts
-- Purpose: Merge conflicting schemas from migrations 20251021000000 and 20251103
-- Created: 2025-11-28
-- Author: Database Engineer
--
-- PROBLEM:
-- - Migration 20251021000000 creates groups with owner_id, name
-- - Migration 20251103 attempts to create groups with host_id, title
-- - Migration 20251126 channels expects host_id to exist
-- - Application code uses host_id
--
-- SOLUTION:
-- - Add missing columns to support both schemas
-- - Create views/aliases for backward compatibility
-- - Update RLS policies to work with both column names
-- - Ensure channels RLS policies function correctly

-- ============================================================================
-- PART 1: ADD MISSING COLUMNS (IDEMPOTENT)
-- ============================================================================

-- Add host_id as alias for owner_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'groups'
                 AND column_name = 'host_id') THEN
    ALTER TABLE public.groups ADD COLUMN host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added host_id column to groups table';
  ELSE
    RAISE NOTICE 'host_id column already exists';
  END IF;
END $$;

-- Add title as alias for name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'groups'
                 AND column_name = 'title') THEN
    ALTER TABLE public.groups ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column to groups table';
  ELSE
    RAISE NOTICE 'title column already exists';
  END IF;
END $$;

-- Add time column if it doesn't exist (from Migration 2)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'groups'
                 AND column_name = 'time') THEN
    ALTER TABLE public.groups ADD COLUMN time TIMESTAMPTZ;
    RAISE NOTICE 'Added time column to groups table';
  ELSE
    RAISE NOTICE 'time column already exists';
  END IF;
END $$;

-- Ensure name column exists (should already exist from Migration 1)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'groups'
                 AND column_name = 'name') THEN
    ALTER TABLE public.groups ADD COLUMN name TEXT;
    RAISE NOTICE 'Added name column to groups table';
  ELSE
    RAISE NOTICE 'name column already exists';
  END IF;
END $$;

-- ============================================================================
-- PART 2: SYNC EXISTING DATA BETWEEN COLUMNS
-- ============================================================================

-- Sync owner_id to host_id for existing records
UPDATE public.groups
SET host_id = owner_id
WHERE host_id IS NULL AND owner_id IS NOT NULL;

-- Sync name to title for existing records
UPDATE public.groups
SET title = name
WHERE title IS NULL AND name IS NOT NULL;

-- Sync title to name for existing records (bidirectional)
UPDATE public.groups
SET name = title
WHERE name IS NULL AND title IS NOT NULL;

-- ============================================================================
-- PART 3: CREATE TRIGGERS TO KEEP COLUMNS IN SYNC
-- ============================================================================

-- Function to sync owner_id/host_id and name/title
CREATE OR REPLACE FUNCTION public.sync_groups_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync owner_id <-> host_id
  IF NEW.owner_id IS NOT NULL AND (OLD.owner_id IS NULL OR NEW.owner_id != OLD.owner_id) THEN
    NEW.host_id := NEW.owner_id;
  ELSIF NEW.host_id IS NOT NULL AND (OLD.host_id IS NULL OR NEW.host_id != OLD.host_id) THEN
    NEW.owner_id := NEW.host_id;
  END IF;

  -- Sync name <-> title
  IF NEW.name IS NOT NULL AND (OLD.name IS NULL OR NEW.name != OLD.name) THEN
    NEW.title := NEW.name;
  ELSIF NEW.title IS NOT NULL AND (OLD.title IS NULL OR NEW.title != OLD.title) THEN
    NEW.name := NEW.title;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_groups_columns_trigger ON public.groups;
CREATE TRIGGER sync_groups_columns_trigger
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_groups_columns();

-- ============================================================================
-- PART 4: FIX CHANNELS RLS POLICIES TO WORK WITH BOTH SCHEMAS
-- ============================================================================

-- Drop and recreate channels policies to use COALESCE for compatibility
DROP POLICY IF EXISTS "channels_insert_host" ON public.channels;
CREATE POLICY "channels_insert_host" ON public.channels
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id
      AND (host_id = auth.uid() OR owner_id = auth.uid())  -- Support both columns
    )
  );

DROP POLICY IF EXISTS "channels_update_host" ON public.channels;
CREATE POLICY "channels_update_host" ON public.channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id
      AND (host_id = auth.uid() OR owner_id = auth.uid())  -- Support both columns
    )
  );

DROP POLICY IF EXISTS "channels_delete_host" ON public.channels;
CREATE POLICY "channels_delete_host" ON public.channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = group_id
      AND (host_id = auth.uid() OR owner_id = auth.uid())  -- Support both columns
    )
  );

-- ============================================================================
-- PART 5: UPDATE GROUPS RLS POLICIES FOR CONSISTENCY
-- ============================================================================

-- Update groups policies to work with both owner_id and host_id
DROP POLICY IF EXISTS "groups_insert_auth" ON public.groups;
CREATE POLICY "groups_insert_auth" ON public.groups
  FOR INSERT WITH CHECK (
    auth.uid() = COALESCE(host_id, owner_id)
  );

DROP POLICY IF EXISTS "groups_update_owner" ON public.groups;
CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE USING (
    auth.uid() = COALESCE(host_id, owner_id)
  );

DROP POLICY IF EXISTS "groups_delete_owner" ON public.groups;
CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE USING (
    auth.uid() = COALESCE(host_id, owner_id)
  );

-- Keep existing group_members-based policies from Migration 1
-- (These already exist and don't need modification)

-- ============================================================================
-- PART 6: ADD HELPFUL INDEXES
-- ============================================================================

-- Index on host_id for channels RLS policies
CREATE INDEX IF NOT EXISTS idx_groups_host_id ON public.groups(host_id);

-- ============================================================================
-- PART 7: VALIDATION CHECKS
-- ============================================================================

-- Verify schema consistency
DO $$
DECLARE
  missing_cols TEXT[];
BEGIN
  SELECT array_agg(col) INTO missing_cols
  FROM (VALUES ('name'), ('title'), ('owner_id'), ('host_id')) AS required(col)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = required.col
  );

  IF missing_cols IS NOT NULL THEN
    RAISE EXCEPTION 'Migration incomplete! Missing columns: %', array_to_string(missing_cols, ', ');
  ELSE
    RAISE NOTICE '✓ All required columns present in groups table';
  END IF;

  -- Verify triggers exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'sync_groups_columns_trigger'
  ) THEN
    RAISE EXCEPTION 'Sync trigger not created!';
  ELSE
    RAISE NOTICE '✓ Column sync trigger installed';
  END IF;

  -- Verify indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'groups'
    AND indexname = 'idx_groups_host_id'
  ) THEN
    RAISE WARNING 'host_id index missing';
  ELSE
    RAISE NOTICE '✓ Performance indexes created';
  END IF;

  RAISE NOTICE '✅ Groups schema migration completed successfully';
END $$;
