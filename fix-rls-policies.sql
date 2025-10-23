-- Fix RLS policies for photos storage
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Create new policies for photos bucket
CREATE POLICY "Photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Users can upload photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Users can update photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'photos');

CREATE POLICY "Users can delete photos" ON storage.objects
FOR DELETE USING (bucket_id = 'photos');

-- Also ensure the photos bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Make sure RLS is enabled but with proper policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
