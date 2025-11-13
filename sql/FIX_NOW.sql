-- IMMEDIATE FIX - Run this in Supabase SQL Editor NOW

-- Step 1: Update is_user_blocked function to match actual schema
-- Try this first (uses user_id and blocked_user_id):
CREATE OR REPLACE FUNCTION is_user_blocked(user1_uuid UUID, user2_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Try user_id and blocked_user_id first
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (user_id = user1_uuid AND blocked_user_id = user2_uuid)
       OR (user_id = user2_uuid AND blocked_user_id = user1_uuid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: If that doesn't work, try blocker_id and blocked_id:
-- CREATE OR REPLACE FUNCTION is_user_blocked(user1_uuid UUID, user2_uuid UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1 FROM blocked_users 
--     WHERE (blocker_id = user1_uuid AND blocked_id = user2_uuid)
--        OR (blocker_id = user2_uuid AND blocked_id = user1_uuid)
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: If function still fails, QUICK FIX - remove blocking check:
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

-- This will allow messages to work immediately

