-- Create blocks table for user blocking
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);

-- Enable Row Level Security
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocks table
CREATE POLICY "Users can view their own blocks"
  ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks"
  ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON public.blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Function to block a user
CREATE OR REPLACE FUNCTION public.block_user(
  target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Can't block yourself
  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;

  -- Insert the block (ignore if already exists due to UNIQUE constraint)
  INSERT INTO public.blocks (blocker_id, blocked_id)
  VALUES (current_user_id, target_user_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
END;
$$;

-- Function to unblock a user
CREATE OR REPLACE FUNCTION public.unblock_user(
  target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete the block
  DELETE FROM public.blocks
  WHERE blocker_id = current_user_id
    AND blocked_id = target_user_id;
END;
$$;

-- Function to check if user has blocked another user
CREATE OR REPLACE FUNCTION public.has_blocked(
  target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  block_exists BOOLEAN;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if block exists
  SELECT EXISTS(
    SELECT 1
    FROM public.blocks
    WHERE blocker_id = current_user_id
      AND blocked_id = target_user_id
  ) INTO block_exists;

  RETURN block_exists;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_blocked(UUID) TO authenticated;
