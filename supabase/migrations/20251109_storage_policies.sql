-- Storage policies for photo albums
-- Run this in Supabase SQL Editor
-- Created: 2025-11-09

-- First, ensure the photos bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos to their albums folder
CREATE POLICY "Users can upload to their albums"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'albums'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to read photos from their albums
CREATE POLICY "Users can read their album photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'albums'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update photos in their albums
CREATE POLICY "Users can update their album photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'albums'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'albums'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete photos from their albums
CREATE POLICY "Users can delete their album photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'albums'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
