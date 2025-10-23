-- Create photo albums system
-- Run this in your Supabase SQL Editor

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create album_permissions table for selective sharing
CREATE TABLE IF NOT EXISTS album_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  granted_to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(album_id, granted_to_user_id)
);

-- Create album_photos table
CREATE TABLE IF NOT EXISTS album_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_albums_user_id ON albums(user_id);
CREATE INDEX IF NOT EXISTS idx_albums_is_public ON albums(is_public);
CREATE INDEX IF NOT EXISTS idx_album_permissions_album_id ON album_permissions(album_id);
CREATE INDEX IF NOT EXISTS idx_album_permissions_granted_to ON album_permissions(granted_to_user_id);
CREATE INDEX IF NOT EXISTS idx_album_permissions_active ON album_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_album_photos_order ON album_photos(photo_order);

-- Enable RLS (Row Level Security)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for albums
CREATE POLICY "Users can view their own albums" ON albums
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public albums" ON albums
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view albums they have permission for" ON albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM album_permissions 
    WHERE album_id = albums.id 
    AND granted_to_user_id = auth.uid() 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  )
);

CREATE POLICY "Users can create their own albums" ON albums
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums" ON albums
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums" ON albums
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for album_permissions
CREATE POLICY "Users can view permissions for their albums" ON album_permissions
FOR SELECT USING (
  auth.uid() = granted_by_user_id OR auth.uid() = granted_to_user_id
);

CREATE POLICY "Users can grant permissions for their albums" ON album_permissions
FOR INSERT WITH CHECK (auth.uid() = granted_by_user_id);

CREATE POLICY "Users can revoke permissions for their albums" ON album_permissions
FOR UPDATE USING (auth.uid() = granted_by_user_id);

CREATE POLICY "Users can delete permissions for their albums" ON album_permissions
FOR DELETE USING (auth.uid() = granted_by_user_id);

-- Create RLS policies for album_photos
CREATE POLICY "Users can view photos in albums they own or have access to" ON album_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE id = album_photos.album_id 
    AND (
      user_id = auth.uid() 
      OR is_public = true
      OR EXISTS (
        SELECT 1 FROM album_permissions 
        WHERE album_id = albums.id 
        AND granted_to_user_id = auth.uid() 
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
      )
    )
  )
);

CREATE POLICY "Users can add photos to their own albums" ON album_photos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE id = album_photos.album_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update photos in their own albums" ON album_photos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE id = album_photos.album_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete photos from their own albums" ON album_photos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE id = album_photos.album_id 
    AND user_id = auth.uid()
  )
);

-- Create function to grant album access
CREATE OR REPLACE FUNCTION grant_album_access(
  album_uuid UUID,
  target_user_uuid UUID,
  expires_hours INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  album_owner UUID;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user owns the album
  SELECT user_id INTO album_owner
  FROM albums
  WHERE id = album_uuid AND user_id = auth.uid();
  
  IF album_owner IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate expiration time if provided
  IF expires_hours IS NOT NULL THEN
    expires_at := NOW() + (expires_hours || ' hours')::INTERVAL;
  END IF;
  
  -- Grant permission
  INSERT INTO album_permissions (album_id, granted_to_user_id, granted_by_user_id, expires_at)
  VALUES (album_uuid, target_user_uuid, auth.uid(), expires_at)
  ON CONFLICT (album_id, granted_to_user_id)
  DO UPDATE SET
    is_active = true,
    expires_at = expires_at,
    granted_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to revoke album access
CREATE OR REPLACE FUNCTION revoke_album_access(
  album_uuid UUID,
  target_user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user owns the album
  IF NOT EXISTS (
    SELECT 1 FROM albums 
    WHERE id = album_uuid AND user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;
  
  -- Revoke permission
  UPDATE album_permissions 
  SET is_active = false
  WHERE album_id = album_uuid 
  AND granted_to_user_id = target_user_uuid;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
