-- Create taps table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.taps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tapper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tapped_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tapped_at TIMESTAMPTZ DEFAULT NOW(),
  is_mutual BOOLEAN DEFAULT false,
  UNIQUE(tapper_id, tapped_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_taps_tapper_id ON public.taps(tapper_id);
CREATE INDEX IF NOT EXISTS idx_taps_tapped_user_id ON public.taps(tapped_user_id);
CREATE INDEX IF NOT EXISTS idx_taps_is_mutual ON public.taps(is_mutual) WHERE is_mutual = true;
CREATE INDEX IF NOT EXISTS idx_taps_tapped_at ON public.taps(tapped_at DESC);

-- Enable Row Level Security
ALTER TABLE public.taps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for taps table
CREATE POLICY "Users can view taps they sent"
  ON public.taps FOR SELECT
  USING (auth.uid() = tapper_id);

CREATE POLICY "Users can view taps they received"
  ON public.taps FOR SELECT
  USING (auth.uid() = tapped_user_id);

CREATE POLICY "Users can insert their own taps"
  ON public.taps FOR INSERT
  WITH CHECK (auth.uid() = tapper_id);

CREATE POLICY "Users can delete their own taps"
  ON public.taps FOR DELETE
  USING (auth.uid() = tapper_id);

-- Function to tap a user
CREATE OR REPLACE FUNCTION public.tap_user(
  target_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  existing_tap RECORD;
  reverse_tap RECORD;
  result JSON;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Can't tap yourself
  IF current_user_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot tap yourself';
  END IF;

  -- Check if tap already exists
  SELECT * INTO existing_tap
  FROM public.taps
  WHERE tapper_id = current_user_id
    AND tapped_user_id = target_user_id;

  IF existing_tap IS NOT NULL THEN
    -- Tap already exists, return it
    result := json_build_object(
      'id', existing_tap.id,
      'is_mutual', existing_tap.is_mutual,
      'tapped_at', existing_tap.tapped_at,
      'already_exists', true
    );
    RETURN result;
  END IF;

  -- Check if the other user has tapped us (reverse tap)
  SELECT * INTO reverse_tap
  FROM public.taps
  WHERE tapper_id = target_user_id
    AND tapped_user_id = current_user_id;

  -- Insert the new tap
  INSERT INTO public.taps (tapper_id, tapped_user_id, is_mutual)
  VALUES (current_user_id, target_user_id, reverse_tap IS NOT NULL)
  RETURNING * INTO existing_tap;

  -- If there's a reverse tap, update it to be mutual
  IF reverse_tap IS NOT NULL THEN
    UPDATE public.taps
    SET is_mutual = true
    WHERE id = reverse_tap.id;
  END IF;

  -- Return the result
  result := json_build_object(
    'id', existing_tap.id,
    'is_mutual', existing_tap.is_mutual,
    'tapped_at', existing_tap.tapped_at,
    'already_exists', false
  );

  RETURN result;
END;
$$;

-- Function to remove a tap
CREATE OR REPLACE FUNCTION public.untap_user(
  target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  reverse_tap_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find reverse tap if it exists
  SELECT id INTO reverse_tap_id
  FROM public.taps
  WHERE tapper_id = target_user_id
    AND tapped_user_id = current_user_id;

  -- Delete the tap
  DELETE FROM public.taps
  WHERE tapper_id = current_user_id
    AND tapped_user_id = target_user_id;

  -- If there's a reverse tap, update it to not be mutual anymore
  IF reverse_tap_id IS NOT NULL THEN
    UPDATE public.taps
    SET is_mutual = false
    WHERE id = reverse_tap_id;
  END IF;
END;
$$;

-- Function to check if user has tapped another user
CREATE OR REPLACE FUNCTION public.has_tapped(
  target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  tap_exists BOOLEAN;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if tap exists
  SELECT EXISTS(
    SELECT 1
    FROM public.taps
    WHERE tapper_id = current_user_id
      AND tapped_user_id = target_user_id
  ) INTO tap_exists;

  RETURN tap_exists;
END;
$$;

-- Function to get mutual taps count
CREATE OR REPLACE FUNCTION public.get_mutual_taps_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  tap_count BIGINT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Count mutual taps
  SELECT COUNT(*)
  INTO tap_count
  FROM public.taps
  WHERE (tapper_id = current_user_id OR tapped_user_id = current_user_id)
    AND is_mutual = true;

  -- Divide by 2 since mutual taps create 2 records
  RETURN tap_count / 2;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.taps TO authenticated;
GRANT EXECUTE ON FUNCTION public.tap_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.untap_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tapped(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mutual_taps_count() TO authenticated;
