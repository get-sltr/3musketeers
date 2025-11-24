-- Fix infinite recursion in profiles RLS policies
-- The issue: having two SELECT policies creates infinite recursion

-- Drop the conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a single, unified SELECT policy
CREATE POLICY "Users can view profiles" ON profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Users can update their own profile only
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile only
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);
