# Album Photo Upload Fix Instructions

## Issue
Album uploads are failing with: "StorageApiError: new row violates row-level security policy"

## Root Cause
The `album_photos` table or storage bucket policies are not properly configured to allow users to upload photos.

## Solution

### Step 1: Fix Database RLS Policies

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Create a new query
5. Copy and paste the following SQL:

```sql
-- Fix album_photos RLS policies
DROP POLICY IF EXISTS "Users can insert photos into their albums" ON album_photos;
DROP POLICY IF EXISTS "Users can select photos from their albums" ON album_photos;
DROP POLICY IF EXISTS "Users can delete photos from their albums" ON album_photos;

-- Allow INSERT to album_photos
CREATE POLICY "Users can insert photos into their albums" ON album_photos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND albums.user_id = auth.uid()
  )
);

-- Allow SELECT from album_photos
CREATE POLICY "Users can select photos from their albums" ON album_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND albums.user_id = auth.uid()
  )
);

-- Allow DELETE from album_photos
CREATE POLICY "Users can delete photos from their albums" ON album_photos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND albums.user_id = auth.uid()
  )
);

-- Fix albums table RLS policies
DROP POLICY IF EXISTS "Users can insert their own albums" ON albums;
DROP POLICY IF EXISTS "Users can view albums they own" ON albums;
DROP POLICY IF EXISTS "Users can update their own albums" ON albums;
DROP POLICY IF EXISTS "Users can delete their own albums" ON albums;

CREATE POLICY "Users can insert their own albums" ON albums
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view albums they own" ON albums
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own albums" ON albums
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own albums" ON albums
FOR DELETE USING (user_id = auth.uid());
```

6. Click **Run**

### Step 2: Fix Storage Bucket Policies

1. In Supabase dashboard, click **Storage** in the left sidebar
2. Click on the **photos** bucket
3. Click **Policies** tab
4. Add these policies (click "+ New Policy" for each):

#### Policy 1: Users can upload albums
- **Policy name:** Users can upload albums
- **Allowed operation:** INSERT
- **Target roles:** authenticated
- **Policy definition:**
```
(bucket_id = 'photos'::text) AND ((storage.foldername(name))[1] = 'albums'::text)
```

#### Policy 2: Users can view album photos
- **Policy name:** Users can view album photos
- **Allowed operation:** SELECT
- **Target roles:** authenticated
- **Policy definition:**
```
(bucket_id = 'photos'::text) AND ((storage.foldername(name))[1] = 'albums'::text)
```

#### Policy 3: Users can delete album photos
- **Policy name:** Users can delete album photos
- **Allowed operation:** DELETE
- **Target roles:** authenticated
- **Policy definition:**
```
(bucket_id = 'photos'::text) AND ((storage.foldername(name))[1] = 'albums'::text)
```

### Step 3: Verify the Fix

1. Refresh your browser
2. Try creating a new album with photos
3. Check browser console for any remaining errors

## If Issues Persist

Check the browser console for specific error messages. Common issues:
- **401 Unauthorized**: Your Supabase session may have expired. Try logging out and logging back in.
- **403 Forbidden**: The storage bucket policies may need adjustment.
- **Row security violation**: The RLS policy in step 1 may not have applied correctly.

## Testing the Upload Flow

1. Open your profile's Album Manager
2. Click "+ New" to create an album
3. Enter an album name
4. Click "Choose Files" and select a photo
5. Click "Create Album"
6. The photo should now upload successfully

## Notes

- Make sure you're logged in with an authenticated user
- The album storage path follows: `albums/{albumId}/{fileName}`
- Photos are stored in the `photos` bucket under the `albums` folder
