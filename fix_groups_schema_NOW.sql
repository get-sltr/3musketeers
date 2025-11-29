-- ⚡ IMMEDIATE FIX FOR GROUPS TABLE SCHEMA
-- Copy and paste this entire file into Supabase Dashboard > SQL Editor > New Query
-- Then click "Run" to apply the fix

-- Step 1: Fix column naming issues
DO $$
BEGIN
  -- If table has 'title' instead of 'name', rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.groups RENAME COLUMN title TO name;
    RAISE NOTICE '✅ Renamed title to name';
  END IF;

  -- Ensure 'name' column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN name TEXT NOT NULL DEFAULT '';
    RAISE NOTICE '✅ Added name column';
  END IF;

  -- Ensure 'host_id' exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'host_id'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN host_id UUID;
    ALTER TABLE public.groups ADD CONSTRAINT groups_host_id_fkey
      FOREIGN KEY (host_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added host_id column';
  END IF;

  -- Copy owner_id to host_id if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'owner_id'
  ) THEN
    UPDATE public.groups SET host_id = owner_id WHERE host_id IS NULL;
    RAISE NOTICE '✅ Copied owner_id to host_id';
  END IF;

  -- Ensure created_at exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.groups ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE '✅ Added created_at column';
  END IF;

  -- Remove 'time' column if it exists (wrong schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'time'
  ) THEN
    ALTER TABLE public.groups DROP COLUMN time;
    RAISE NOTICE '✅ Removed time column';
  END IF;
END $$;

-- Step 2: Fix trigger to work with both owner_id and host_id
CREATE OR REPLACE FUNCTION public.add_group_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, COALESCE(NEW.host_id, NEW.owner_id), 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_owner();

-- Step 3: Update RLS policies to work with both schemas
DROP POLICY IF EXISTS "groups_insert_auth" ON public.groups;
CREATE POLICY "groups_insert_auth" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = COALESCE(host_id, owner_id));

DROP POLICY IF EXISTS "groups_update_owner" ON public.groups;
CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE USING (auth.uid() = COALESCE(host_id, owner_id));

DROP POLICY IF EXISTS "groups_delete_owner" ON public.groups;
CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE USING (auth.uid() = COALESCE(host_id, owner_id));

DROP POLICY IF EXISTS "groups_select_all" ON public.groups;
CREATE POLICY "groups_select_all" ON public.groups
  FOR SELECT USING (true);

-- ✅ DONE! You should now be able to create groups without errors.
