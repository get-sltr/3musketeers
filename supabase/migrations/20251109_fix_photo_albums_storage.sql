-- Fix photo albums storage RLS policies
-- Purpose: Allow users to upload photos to their albums
-- Created: 2025-11-09

-- Create albums table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create album_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.album_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_order INTEGER DEFAULT 0
);

-- Enable RLS on albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Enable RLS on album_photos
ALTER TABLE public.album_photos ENABLE ROW LEVEL SECURITY;

-- Albums policies
DROP POLICY IF EXISTS "Users can view their own albums" ON public.albums;
CREATE POLICY "Users can view their own albums"
  ON public.albums
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own albums" ON public.albums;
CREATE POLICY "Users can create their own albums"
  ON public.albums
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own albums" ON public.albums;
CREATE POLICY "Users can update their own albums"
  ON public.albums
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own albums" ON public.albums;
CREATE POLICY "Users can delete their own albums"
  ON public.albums
  FOR DELETE
  USING (user_id = auth.uid());

-- Album photos policies
DROP POLICY IF EXISTS "Users can view photos in their albums" ON public.album_photos;
CREATE POLICY "Users can view photos in their albums"
  ON public.album_photos
  FOR SELECT
  USING (
    album_id IN (
      SELECT id FROM public.albums WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add photos to their albums" ON public.album_photos;
CREATE POLICY "Users can add photos to their albums"
  ON public.album_photos
  FOR INSERT
  WITH CHECK (
    album_id IN (
      SELECT id FROM public.albums WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete photos from their albums" ON public.album_photos;
CREATE POLICY "Users can delete photos from their albums"
  ON public.album_photos
  FOR DELETE
  USING (
    album_id IN (
      SELECT id FROM public.albums WHERE user_id = auth.uid()
    )
  );

-- Storage bucket policies (run this in Supabase Storage UI or via SQL)
-- Note: This assumes 'photos' bucket exists. Create it if needed.

-- Allow authenticated users to upload photos to their own albums folder
-- Execute this in the Supabase dashboard under Storage > Policies:
-- Bucket: photos
-- Policy name: Users can upload to their albums
-- Allowed operation: INSERT
-- Policy definition: bucket_id = 'photos' AND (storage.foldername(name))[1] = 'albums' AND (storage.foldername(name))[2] = auth.uid()::text

-- Allow authenticated users to read photos from their albums
-- Bucket: photos
-- Policy name: Users can read their album photos
-- Allowed operation: SELECT
-- Policy definition: bucket_id = 'photos' AND (storage.foldername(name))[1] = 'albums' AND (storage.foldername(name))[2] = auth.uid()::text

-- Allow authenticated users to delete photos from their albums
-- Bucket: photos
-- Policy name: Users can delete their album photos
-- Allowed operation: DELETE
-- Policy definition: bucket_id = 'photos' AND (storage.foldername(name))[1] = 'albums' AND (storage.foldername(name))[2] = auth.uid()::text

-- Add comments
COMMENT ON TABLE public.albums IS 'User photo albums for organizing private/public photo sets';
COMMENT ON TABLE public.album_photos IS 'Photos within albums, referencing storage paths';
