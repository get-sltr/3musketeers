-- RESTORE WORKING RLS POLICY FOR MESSAGES
-- Run this complete script in Supabase SQL Editor

-- Step 1: Drop any existing broken policies
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

-- Step 2: Create simple working policy (original working version)
CREATE POLICY "Users can send messages" ON messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Step 3: Create view policy
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);

-- Step 4: Create update policy (for read status)
CREATE POLICY "Users can update message read status" ON messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Done! This restores the original working policies




