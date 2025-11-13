-- Storage Buckets & Policies Verification
-- Run this in your Supabase SQL Editor to verify Step 3 implementation

-- =====================================================
-- 1. CHECK STORAGE BUCKETS
-- =====================================================

SELECT 
  id,
  name,
  public,
  created_at,
  updated_at,
  CASE 
    WHEN public THEN '🌐 PUBLIC'
    ELSE '🔒 PRIVATE'
  END as access_type
FROM storage.buckets
WHERE id IN ('photos', 'avatars', 'files')
ORDER BY id;

-- =====================================================
-- 2. CHECK STORAGE POLICIES (DETAILED)
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 READ'
    WHEN cmd = 'INSERT' THEN '➕ UPLOAD'
    WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
    WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
    ELSE cmd
  END as operation,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- 3. POLICY COUNT BY BUCKET
-- =====================================================

-- Count policies by bucket (extracted from policy names)
SELECT 
  CASE 
    WHEN policyname LIKE '%Photos%' THEN 'photos'
    WHEN policyname LIKE '%Avatars%' THEN 'avatars'
    WHEN policyname LIKE '%files%' THEN 'files'
    ELSE 'other'
  END as bucket_name,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
GROUP BY 
  CASE 
    WHEN policyname LIKE '%Photos%' THEN 'photos'
    WHEN policyname LIKE '%Avatars%' THEN 'avatars'
    WHEN policyname LIKE '%files%' THEN 'files'
    ELSE 'other'
  END, cmd
ORDER BY bucket_name, cmd;

-- =====================================================
-- 4. EXPECTED VS ACTUAL STORAGE POLICIES
-- =====================================================

-- Expected storage policies
WITH expected_storage_policies AS (
  SELECT 'Photos are publicly accessible' as policy_name, 'SELECT' as cmd, 'photos' as bucket
  UNION ALL SELECT 'Users can upload their own photos', 'INSERT', 'photos'
  UNION ALL SELECT 'Users can update their own photos', 'UPDATE', 'photos'
  UNION ALL SELECT 'Users can delete their own photos', 'DELETE', 'photos'
  UNION ALL SELECT 'Avatars are publicly accessible', 'SELECT', 'avatars'
  UNION ALL SELECT 'Users can upload their own avatars', 'INSERT', 'avatars'
  UNION ALL SELECT 'Users can update their own avatars', 'UPDATE', 'avatars'
  UNION ALL SELECT 'Users can delete their own avatars', 'DELETE', 'avatars'
  UNION ALL SELECT 'Users can view files in their conversations', 'SELECT', 'files'
  UNION ALL SELECT 'Users can upload files to their conversations', 'INSERT', 'files'
  UNION ALL SELECT 'Users can update files in their conversations', 'UPDATE', 'files'
  UNION ALL SELECT 'Users can delete files in their conversations', 'DELETE', 'files'
),
actual_storage_policies AS (
  SELECT policyname, cmd
  FROM pg_policies 
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
)
SELECT 
  e.policy_name,
  e.cmd,
  e.bucket,
  CASE 
    WHEN a.policyname IS NOT NULL THEN '✅ IMPLEMENTED'
    ELSE '❌ MISSING'
  END as status
FROM expected_storage_policies e
LEFT JOIN actual_storage_policies a ON e.policy_name = a.policyname AND e.cmd = a.cmd
ORDER BY e.bucket, e.cmd, e.policy_name;

-- =====================================================
-- 5. STORAGE SETUP SUMMARY
-- =====================================================

SELECT 
  'Storage Buckets' as component,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 3 THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE'
  END as status
FROM storage.buckets
WHERE id IN ('photos', 'avatars', 'files')

UNION ALL

SELECT 
  'Storage Policies' as component,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE'
  END as status
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';

















