-- Storage policies for profile photos
-- Copy and paste this entire file into Supabase SQL Editor

-- Allow authenticated users to upload profile photos
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Allow authenticated users to read profile photos
CREATE POLICY "Anyone can read profile photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Allow authenticated users to update profile photos
CREATE POLICY "Anyone can update profile photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'profiles'
)
WITH CHECK (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Allow authenticated users to delete profile photos
CREATE POLICY "Anyone can delete profile photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- Make photos bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'photos';
