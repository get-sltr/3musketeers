-- FIX RLS POLICY - Correct syntax
-- Run this in Supabase SQL Editor

-- First, drop the broken policy
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Option 1: Simple version (like supabase_schema.sql)
CREATE POLICY "Users can send messages" ON messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- OR Option 2: With conversation check (like messaging-database.sql)
-- DROP POLICY IF EXISTS "Users can send messages" ON messages;
-- CREATE POLICY "Users can send messages in their conversations" ON messages
-- FOR INSERT WITH CHECK (
--   sender_id = auth.uid() AND
--   EXISTS (
--     SELECT 1 FROM conversations 
--     WHERE id = conversation_id 
--     AND (user1_id = auth.uid() OR user2_id = auth.uid())
--   )
-- );

