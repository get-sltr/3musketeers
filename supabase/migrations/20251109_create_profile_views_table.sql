-- Create profile_views table for tracking who viewed your profile
-- Purpose: Track profile views between users
-- Used by: Who Viewed You feature
-- Created: 2025-11-09

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_viewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user ON public.profile_views(viewed_user_id, last_viewed DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON public.profile_views(viewer_id, last_viewed DESC);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see who viewed their profile
CREATE POLICY "Users can see who viewed their profile"
  ON public.profile_views
  FOR SELECT
  USING (viewed_user_id = auth.uid());

-- Policy: Users can create views when they view others' profiles
CREATE POLICY "Users can record profile views"
  ON public.profile_views
  FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- Policy: Users can update their own view records (update last_viewed timestamp)
CREATE POLICY "Users can update their view records"
  ON public.profile_views
  FOR UPDATE
  USING (viewer_id = auth.uid())
  WITH CHECK (viewer_id = auth.uid());

-- Add comment
COMMENT ON TABLE public.profile_views IS 'Tracks which users viewed other users profiles for "Who Viewed You" feature';
