-- Fix blocked_users schema and RLS policy
-- Run this in Supabase SQL Editor

-- Option 1: Check actual schema first
-- Run this to see what columns actually exist:
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'blocked_users'
ORDER BY ordinal_position;

-- Option 2: If table doesn't exist or has wrong columns, create/fix it:
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Option 3: Update is_user_blocked function to match actual schema
-- If your table has different column names, update this:
CREATE OR REPLACE FUNCTION is_user_blocked(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if blocked_users table exists and has correct columns
  -- If column names are different, update here
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = user1_uuid AND blocked_id = user2_uuid)
       OR (blocker_id = user2_uuid AND blocked_id = user1_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Option 4: TEMPORARY FIX - Simplify RLS policy to skip blocking check
-- This allows messages to work while we fix the schema
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

CREATE POLICY "Users can send messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- This removes the blocking check temporarily so messages work
-- Re-add blocking check once schema is fixed

