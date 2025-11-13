-- Create table for EROS message behavior learning
CREATE TABLE IF NOT EXISTS public.message_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  who_they_message JSONB DEFAULT '[]'::jsonb,
  response_patterns JSONB DEFAULT '{}'::jsonb,
  ghost_patterns JSONB DEFAULT '{}'::jsonb,
  message_style TEXT,
  successful_convos JSONB DEFAULT '[]'::jsonb,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_message_behavior_user_id
ON public.message_behavior_patterns(user_id);

-- Create index for analyzed_at for finding stale analyses
CREATE INDEX IF NOT EXISTS idx_message_behavior_analyzed_at
ON public.message_behavior_patterns(analyzed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.message_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own message behavior patterns"
  ON public.message_behavior_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message behavior patterns"
  ON public.message_behavior_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message behavior patterns"
  ON public.message_behavior_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.message_behavior_patterns TO authenticated;

-- Create view for EROS learning dashboard (optional)
CREATE OR REPLACE VIEW public.eros_learning_summary AS
SELECT
  user_id,
  COALESCE(jsonb_array_length(who_they_message), 0) as types_they_message,
  message_style,
  COALESCE(jsonb_array_length(successful_convos), 0) as successful_convo_count,
  analyzed_at,
  EXTRACT(EPOCH FROM (NOW() - analyzed_at))/3600 as hours_since_analysis
FROM public.message_behavior_patterns;

-- Grant view access
GRANT SELECT ON public.eros_learning_summary TO authenticated;
