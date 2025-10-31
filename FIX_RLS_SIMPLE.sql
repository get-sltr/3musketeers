-- SIMPLE FIX - Run this in Supabase SQL Editor

-- Drop all existing message policies
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Create simple working policy (no conversation check)
CREATE POLICY "Users can send messages" ON messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- This is the simplest version that should work
-- Matches the original supabase_schema.sql version

