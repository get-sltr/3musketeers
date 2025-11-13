-- RESTORE ORIGINAL WORKING RLS POLICY
-- This is the policy that was working before we broke it

-- Drop the broken policy with blocking check
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Restore the ORIGINAL working policy (no blocking check)
CREATE POLICY "Users can send messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- This matches the original working version in messaging-database.sql
-- No blocking check - that was added later and broke things

