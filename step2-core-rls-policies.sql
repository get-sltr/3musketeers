-- Step 2: Core RLS Policies Implementation
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user is blocked
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

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_uuid UUID,
  activity_type TEXT,
  activity_data JSONB DEFAULT '{}'::jsonb,
  ip_addr INET DEFAULT NULL,
  user_agent_text TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO user_activity_log (user_id, activity_type, activity_data, ip_address, user_agent)
  VALUES (user_uuid, activity_type, activity_data, ip_addr, user_agent_text)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. PROFILES TABLE RLS POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Users can view other profiles (for discovery)
CREATE POLICY "Users can view other profiles" ON profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 4. CONVERSATIONS TABLE RLS POLICIES
-- =====================================================

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations" ON conversations
FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations" ON conversations
FOR UPDATE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- =====================================================
-- 5. MESSAGES TABLE RLS POLICIES
-- =====================================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Users can send messages in their conversations (with blocking check)
CREATE POLICY "Users can send messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  NOT is_user_blocked(sender_id, receiver_id) AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (sender_id = auth.uid());

-- =====================================================
-- 6. SECURITY TABLES RLS POLICIES
-- =====================================================

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON user_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
FOR DELETE USING (auth.uid() = user_id);

-- Activity log policies
CREATE POLICY "Users can view their own activity" ON user_activity_log
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON user_activity_log
FOR INSERT WITH CHECK (true);

-- Blocked users policies
CREATE POLICY "Users can view their own blocks" ON blocked_users
FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users" ON blocked_users
FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock users" ON blocked_users
FOR DELETE USING (auth.uid() = blocker_id);

-- Reported users policies
CREATE POLICY "Users can view their own reports" ON reported_users
FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can report other users" ON reported_users
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check that RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED'
    ELSE 'RLS DISABLED'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tablename;

-- Check that policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'conversations', 'messages', 'albums', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users')
ORDER BY tablename, policyname;

-- Check that functions were created
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('is_user_blocked', 'log_user_activity')
ORDER BY routine_name;












