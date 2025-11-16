-- Black Card Invite System
-- Allows super admins to generate invite codes for friends/family

-- Create black_cards table
CREATE TABLE IF NOT EXISTS public.black_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_claimed BOOLEAN DEFAULT false,
  notes TEXT,
  CONSTRAINT valid_code_format CHECK (code ~ '^SLTR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_black_cards_code ON public.black_cards(code);
CREATE INDEX IF NOT EXISTS idx_black_cards_claimed ON public.black_cards(is_claimed, is_active);
CREATE INDEX IF NOT EXISTS idx_black_cards_created_by ON public.black_cards(created_by);

-- Function to generate a unique black card code
CREATE OR REPLACE FUNCTION public.generate_black_card_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code in format SLTR-XXXX-XXXX-XXXX
    new_code := 'SLTR-' ||
                substring(md5(random()::text || clock_timestamp()::text) from 1 for 4) ||
                '-' ||
                substring(md5(random()::text || clock_timestamp()::text) from 5 for 4) ||
                '-' ||
                substring(md5(random()::text || clock_timestamp()::text) from 9 for 4);
    
    -- Convert to uppercase
    new_code := upper(new_code);
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.black_cards WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to generate multiple black cards (super admin only)
CREATE OR REPLACE FUNCTION public.generate_black_cards(
  p_admin_id UUID,
  p_count INT DEFAULT 1,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Check if requesting user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = p_admin_id
    AND profiles.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  -- Validate count
  IF p_count < 1 OR p_count > 1000 THEN
    RAISE EXCEPTION 'Count must be between 1 and 1000';
  END IF;

  -- Generate cards
  FOR i IN 1..p_count LOOP
    v_code := generate_black_card_code();
    
    INSERT INTO public.black_cards (code, created_by, notes)
    VALUES (v_code, p_admin_id, p_notes)
    RETURNING black_cards.id, black_cards.code, black_cards.created_at
    INTO v_id, v_code, v_created_at;
    
    id := v_id;
    code := v_code;
    created_at := v_created_at;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Function to get all black cards (super admin only)
CREATE OR REPLACE FUNCTION public.get_black_cards(
  p_admin_id UUID,
  p_filter TEXT DEFAULT 'all' -- 'all', 'unclaimed', 'claimed', 'inactive'
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMPTZ,
  claimed_by UUID,
  claimed_by_name TEXT,
  claimed_at TIMESTAMPTZ,
  is_active BOOLEAN,
  is_claimed BOOLEAN,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if requesting user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = p_admin_id
    AND profiles.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  -- Return cards based on filter
  RETURN QUERY
  SELECT
    bc.id,
    bc.code,
    bc.created_by,
    creator.display_name AS created_by_name,
    bc.created_at,
    bc.claimed_by,
    claimer.display_name AS claimed_by_name,
    bc.claimed_at,
    bc.is_active,
    bc.is_claimed,
    bc.notes
  FROM public.black_cards bc
  LEFT JOIN public.profiles creator ON bc.created_by = creator.id
  LEFT JOIN public.profiles claimer ON bc.claimed_by = claimer.id
  WHERE
    CASE p_filter
      WHEN 'unclaimed' THEN bc.is_claimed = false AND bc.is_active = true
      WHEN 'claimed' THEN bc.is_claimed = true
      WHEN 'inactive' THEN bc.is_active = false
      ELSE true
    END
  ORDER BY bc.created_at DESC;
END;
$$;

-- Function to validate and claim a black card (public)
CREATE OR REPLACE FUNCTION public.claim_black_card(
  p_user_id UUID,
  p_code TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  card_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_id UUID;
  v_is_active BOOLEAN;
  v_is_claimed BOOLEAN;
BEGIN
  -- Normalize code (uppercase, trim)
  p_code := upper(trim(p_code));

  -- Check if card exists
  SELECT id, is_active, is_claimed
  INTO v_card_id, v_is_active, v_is_claimed
  FROM public.black_cards
  WHERE code = p_code;

  IF v_card_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid code'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF NOT v_is_active THEN
    RETURN QUERY SELECT false, 'This card has been deactivated'::TEXT, v_card_id;
    RETURN;
  END IF;

  IF v_is_claimed THEN
    RETURN QUERY SELECT false, 'This card has already been claimed'::TEXT, v_card_id;
    RETURN;
  END IF;

  -- Claim the card
  UPDATE public.black_cards
  SET
    claimed_by = p_user_id,
    claimed_at = NOW(),
    is_claimed = true
  WHERE id = v_card_id;

  RETURN QUERY SELECT true, 'Card claimed successfully'::TEXT, v_card_id;
END;
$$;

-- Function to deactivate a black card (super admin only)
CREATE OR REPLACE FUNCTION public.deactivate_black_card(
  p_admin_id UUID,
  p_card_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if requesting user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = p_admin_id
    AND profiles.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  -- Deactivate card
  UPDATE public.black_cards
  SET is_active = false
  WHERE id = p_card_id;

  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.black_cards TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_black_cards TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_black_cards TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_black_card TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_black_card TO authenticated;

-- Comments
COMMENT ON TABLE public.black_cards IS 'Invite codes for friends and family (super admin generated)';
COMMENT ON FUNCTION public.generate_black_cards IS 'Generate multiple black card codes (super admin only)';
COMMENT ON FUNCTION public.get_black_cards IS 'Get all black cards with filter (super admin only)';
COMMENT ON FUNCTION public.claim_black_card IS 'Validate and claim a black card code';
COMMENT ON FUNCTION public.deactivate_black_card IS 'Deactivate a black card (super admin only)';
