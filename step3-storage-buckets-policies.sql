-- Step 3: Storage Buckets and Policies
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. CREATE STORAGE BUCKETS
-- =====================================================

-- Create photos bucket (public for profile photos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (public for user avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create files bucket (private for shared files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. VERIFY BUCKETS CREATED
-- =====================================================

-- Check that buckets were created successfully
SELECT 
  id,
  name,
  public,
  created_at,
  updated_at
FROM storage.buckets
WHERE id IN ('photos', 'avatars', 'files')
ORDER BY id;

-- =====================================================
-- 3. CREATE STORAGE POLICIES
-- =====================================================

-- Photos bucket policies (public access)
CREATE POLICY "Photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatars bucket policies (public access)
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Files bucket policies (private, conversation-based)
CREATE POLICY "Users can view files in their conversations" ON storage.objects
FOR SELECT USING (
  bucket_id = 'files' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can upload files to their conversations" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update files in their conversations" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'files' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can delete files in their conversations" ON storage.objects
FOR DELETE USING (
  bucket_id = 'files' AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id::text = (storage.foldername(name))[1]
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

-- =====================================================
-- 4. VERIFY POLICIES CREATED
-- =====================================================

-- Check that storage policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- 5. TEST BUCKET ACCESS
-- =====================================================

-- Test that buckets are accessible
SELECT 
  'photos' as bucket_name,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'photos') 
       THEN 'CREATED' 
       ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'avatars' as bucket_name,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
       THEN 'CREATED' 
       ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'files' as bucket_name,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'files') 
       THEN 'CREATED' 
       ELSE 'MISSING' 
  END as status;








