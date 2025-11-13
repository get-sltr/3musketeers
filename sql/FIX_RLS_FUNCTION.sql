-- Fix: Update is_user_blocked function to match ACTUAL schema
-- The table uses: user_id and blocked_user_id
-- NOT: blocker_id and blocked_id

-- First, check the actual schema:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'blocked_users';

-- Then fix the function based on ACTUAL columns:

-- OPTION 1: If table uses user_id and blocked_user_id:
CREATE OR REPLACE FUNCTION is_user_blocked(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (user_id = user1_uuid AND blocked_user_id = user2_uuid)
       OR (user_id = user2_uuid AND blocked_user_id = user1_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- OPTION 2: If table uses blocker_id and blocked_id (but doesn't exist yet):
CREATE OR REPLACE FUNCTION is_user_blocked(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = user1_uuid AND blocked_id = user2_uuid)
       OR (blocker_id = user2_uuid AND blocked_id = user1_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- OPTION 3: If blocked_users table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Then use OPTION 1 function above

-- OPTION 4: QUICK FIX - Temporarily remove blocking check:
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

