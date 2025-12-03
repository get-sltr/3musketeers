-- Create saved_phrases table for quick message templates
-- Users can save frequently used phrases for quick insertion into messages

CREATE TABLE IF NOT EXISTS public.saved_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_phrases_user_id ON public.saved_phrases(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_phrases_order ON public.saved_phrases(user_id, order_index);

-- Enable RLS
ALTER TABLE public.saved_phrases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved phrases
CREATE POLICY "Users can view their own saved phrases"
  ON public.saved_phrases FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved phrases
CREATE POLICY "Users can insert their own saved phrases"
  ON public.saved_phrases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved phrases
CREATE POLICY "Users can update their own saved phrases"
  ON public.saved_phrases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved phrases
CREATE POLICY "Users can delete their own saved phrases"
  ON public.saved_phrases FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_saved_phrases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_saved_phrases_updated_at
  BEFORE UPDATE ON public.saved_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_saved_phrases_updated_at();

