-- Add missing columns to profiles table
-- Run this in your Supabase SQL Editor

-- Add photos column (JSON array of photo URLs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Add photo_urls column (alternative to photos)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;

-- Add kinks column (JSON array)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kinks JSONB DEFAULT '[]'::jsonb;

-- Add tags column (JSON array) 
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add party_friendly column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS party_friendly BOOLEAN DEFAULT false;

-- Add dtfn column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dtfn BOOLEAN DEFAULT false;

-- Add position column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT;

-- Add about column (for bio)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about TEXT;

-- Add online status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT false;

-- Add last_active timestamp
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at timestamp
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add additional profile fields from Grindr reference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS body_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tribe JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expectations TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hiv_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_tested TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vaccinated_for JSONB DEFAULT '[]'::jsonb;

-- Create photos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for photos bucket
CREATE POLICY IF NOT EXISTS "Photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY IF NOT EXISTS "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can update their own photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Users can delete their own photos" ON storage.objects
FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update existing profiles to have default values
UPDATE profiles SET 
  photos = '[]'::jsonb,
  photo_urls = '[]'::jsonb,
  kinks = '[]'::jsonb,
  tags = '[]'::jsonb,
  party_friendly = false,
  dtfn = false,
  online = false,
  last_active = NOW(),
  tribe = '[]'::jsonb,
  vaccinated_for = '[]'::jsonb
WHERE photos IS NULL OR photo_urls IS NULL OR kinks IS NULL OR tags IS NULL;
