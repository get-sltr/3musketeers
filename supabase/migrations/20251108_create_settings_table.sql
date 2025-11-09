-- Create settings table for global app configuration
-- Purpose: Store global app settings like party_mode and pride_month
-- Used by: useHoloPins hook for dynamic pin styling
-- Created: 2025-11-08

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_mode INTEGER DEFAULT 0,
  pride_month INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO public.settings (party_mode, pride_month)
VALUES (0, 0)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read settings"
  ON public.settings
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can update settings (for future admin panel)
CREATE POLICY "Authenticated users can update settings"
  ON public.settings
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE public.settings IS 'Global app settings for party mode, pride month, and other feature toggles';
