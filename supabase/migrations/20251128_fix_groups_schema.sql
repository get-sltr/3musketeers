-- Migration: Fix groups table schema conflicts
-- This ensures the groups table has the correct columns that the app expects

-- Drop the problematic groups table if it has the wrong schema
-- and recreate with the correct one
DO $$
BEGIN
  -- Check if groups table has 'title' instead of 'name'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'name'
  ) THEN
    -- Rename 'title' to 'name' if 'name' doesn't exist
    ALTER TABLE public.groups RENAME COLUMN title TO name;
  END IF;

  -- Ensure 'name' column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN name TEXT NOT NULL DEFAULT '';
  END IF;

  -- Ensure 'host_id' column exists (added by 20251103 migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'host_id'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- If owner_id exists but host_id doesn't have values, copy them over
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'owner_id'
  ) THEN
    -- Copy owner_id to host_id where host_id is null
    UPDATE public.groups SET host_id = owner_id WHERE host_id IS NULL;
  END IF;

  -- Ensure created_at exists with default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- Remove the 'time' column if it exists (from wrong schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'groups'
    AND column_name = 'time'
  ) THEN
    ALTER TABLE public.groups DROP COLUMN time;
  END IF;

END $$;

-- Update the trigger to use host_id instead of owner_id
-- (or create it if it doesn't exist)
CREATE OR REPLACE FUNCTION public.add_group_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Use host_id (new schema) or owner_id (old schema) depending on which is set
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, COALESCE(NEW.host_id, NEW.owner_id), 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_owner();

-- Update policies to work with both host_id and owner_id for compatibility
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

-- Ensure groups table is visible (keep existing select policies but make them work)
DROP POLICY IF EXISTS "groups_select_all" ON public.groups;
CREATE POLICY "groups_select_all" ON public.groups
  FOR SELECT USING (true);
