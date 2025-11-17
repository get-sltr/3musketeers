-- Fix album_photos RLS policies for photo uploads

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert photos into their albums" ON album_photos;
DROP POLICY IF EXISTS "Users can select photos from their albums" ON album_photos;
DROP POLICY IF EXISTS "Users can delete photos from their albums" ON album_photos;

-- Create INSERT policy - allow users to insert photos into their own albums
CREATE POLICY "Users can insert photos into their albums" ON album_photos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND albums.user_id = auth.uid()
  )
);

-- Create SELECT policy - allow users to view photos from albums they own or have access to
CREATE POLICY "Users can select photos from their albums" ON album_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND (
      albums.user_id = auth.uid()
      OR albums.is_public = true
      OR EXISTS (
        SELECT 1 FROM album_permissions
        WHERE album_permissions.album_id = albums.id
        AND album_permissions.granted_to_user_id = auth.uid()
        AND album_permissions.is_active = true
      )
    )
  )
);

-- Create DELETE policy - allow users to delete photos from their own albums
CREATE POLICY "Users can delete photos from their albums" ON album_photos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM albums
    WHERE albums.id = album_photos.album_id
    AND albums.user_id = auth.uid()
  )
);

-- Also fix albums table policies if needed
DROP POLICY IF EXISTS "Users can insert their own albums" ON albums;
DROP POLICY IF EXISTS "Users can view albums they own or have access to" ON albums;
DROP POLICY IF EXISTS "Users can update their own albums" ON albums;
DROP POLICY IF EXISTS "Users can delete their own albums" ON albums;

CREATE POLICY "Users can insert their own albums" ON albums
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view albums they own or have access to" ON albums
FOR SELECT USING (
  user_id = auth.uid()
  OR is_public = true
  OR EXISTS (
    SELECT 1 FROM album_permissions
    WHERE album_permissions.album_id = albums.id
    AND album_permissions.granted_to_user_id = auth.uid()
    AND album_permissions.is_active = true
  )
);

CREATE POLICY "Users can update their own albums" ON albums
FOR UPDATE WITH CHECK (user_id = auth.uid())
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own albums" ON albums
FOR DELETE USING (user_id = auth.uid());
