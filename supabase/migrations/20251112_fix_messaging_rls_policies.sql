-- Fix RLS policies for conversations and messages tables
-- This allows users to create conversations and send messages

-- Enable RLS on conversations table (if not already enabled)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversation messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- CONVERSATIONS POLICIES
CREATE POLICY "Users can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (
    (select auth.uid()) = user1_id
    OR (select auth.uid()) = user2_id
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user1_id
    OR (select auth.uid()) = user2_id
  );

-- MESSAGES POLICIES
CREATE POLICY "Users can view conversation messages"
  ON public.messages
  FOR SELECT
  USING (
    (select auth.uid()) IN (
      SELECT user1_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT user2_id FROM public.conversations WHERE id = conversation_id
    )
  );

CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND (select auth.uid()) IN (
      SELECT user1_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT user2_id FROM public.conversations WHERE id = conversation_id
    )
  );

COMMENT ON POLICY "Users can view their conversations" ON public.conversations IS 'Allow users to view conversations they are part of';
COMMENT ON POLICY "Users can create conversations" ON public.conversations IS 'Allow users to create new conversations';
COMMENT ON POLICY "Users can view conversation messages" ON public.messages IS 'Allow users to view messages in their conversations';
COMMENT ON POLICY "Users can send messages" ON public.messages IS 'Allow users to send messages in their conversations';
