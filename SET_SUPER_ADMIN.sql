-- Set kminn121@gmail.com as Super Admin
-- Run this in Supabase SQL Editor

-- First, check if the column exists (should exist from migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added is_super_admin column';
    ELSE
        RAISE NOTICE 'is_super_admin column already exists';
    END IF;
END$$;

-- Set kminn121@gmail.com as super admin
UPDATE public.profiles
SET is_super_admin = true
WHERE email = 'kminn121@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    username,
    display_name,
    is_super_admin,
    created_at
FROM public.profiles
WHERE email = 'kminn121@gmail.com';

-- Show all super admins
SELECT 
    email,
    username,
    display_name,
    is_super_admin
FROM public.profiles
WHERE is_super_admin = true;
