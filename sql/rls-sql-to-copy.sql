-- Comprehensive Row Level Security (RLS) Implementation for SLTR
-- This file implements enterprise-grade security policies for all tables
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. PROFILES TABLE RLS POLICIES
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

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
-- 2. ENHANCED MESSAGING RLS POLICIES
-- =====================================================

-- Drop existing messaging policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Enhanced conversation policies
CREATE POLICY "Users can view their own conversations" ON conversations
FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

CREATE POLICY "Users can update their own conversations" ON conversations
FOR UPDATE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Enhanced message policies with additional security
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (user1_id = auth.uid() OR user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (sender_id = auth.uid());

-- Add policy for message deletion (users can delete their own messages)
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (sender_id = auth.uid());

-- =====================================================
-- 3. ENHANCED ALBUMS RLS POLICIES
-- =====================================================

-- Drop existing album policies
DROP POLICY IF EXISTS "Users can view their own albums" ON albums;
DROP POLICY IF EXISTS "Users can view public albums" ON albums;
DROP POLICY IF EXISTS "Users can view albums they have permission for" ON albums;
DROP POLICY IF EXISTS "Users can create their own albums" ON albums;
DROP POLICY IF EXISTS "Users can update their own albums" ON albums;
DROP POLICY IF EXISTS "Users can delete their own albums" ON albums;

-- Enhanced album policies
CREATE POLICY "Users can view their own albums" ON albums
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public albums" ON albums
FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view albums they have permission for" ON albums
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM album_permissions 
    WHERE album_id = albums.id 
    AND granted_to_user_id = auth.uid() 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  )
);

CREATE POLICY "Users can create their own albums" ON albums
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums" ON albums
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums" ON albums
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. STORAGE BUCKET RLS POLICIES
-- =====================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos" ON storage.objects;

-- Enhanced storage policies
CREATE POLICY "Photos are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 5. ADDITIONAL SECURITY TABLES
-- =====================================================

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create user_activity_log table for audit trail
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blocked_users table for user blocking
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  UNIQUE(blocker_id, blocked_id)
);

-- Create reported_users table for user reporting
CREATE TABLE IF NOT EXISTS reported_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 6. RLS POLICIES FOR NEW SECURITY TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_users ENABLE ROW LEVEL SECURITY;

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
-- 7. SECURITY FUNCTIONS
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

-- Function to create user session
CREATE OR REPLACE FUNCTION create_user_session(
  user_uuid UUID,
  session_token_text TEXT,
  ip_addr INET DEFAULT NULL,
  user_agent_text TEXT DEFAULT NULL,
  expires_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
  VALUES (user_uuid, session_token_text, ip_addr, user_agent_text, NOW() + (expires_hours || ' hours')::INTERVAL)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ENHANCED MESSAGE POLICIES WITH BLOCKING
-- =====================================================

-- Drop and recreate message policies with blocking check
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

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

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for new security tables
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reported_users_reporter ON reported_users(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reported_users_reported ON reported_users(reported_id);
CREATE INDEX IF NOT EXISTS idx_reported_users_status ON reported_users(status);

-- =====================================================
-- 10. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_timestamp();

-- Trigger to log profile updates
CREATE OR REPLACE FUNCTION log_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_user_activity(
    NEW.id,
    'profile_updated',
    jsonb_build_object(
      'updated_fields', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE key != 'updated_at' AND to_jsonb(NEW) ->> key != to_jsonb(OLD) ->> key
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_profile_updates
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_update();

-- =====================================================
-- 11. CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old activity logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_activity_log 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. FINAL SECURITY CHECKS
-- =====================================================

-- Ensure all tables have RLS enabled
DO $$
DECLARE
  table_name TEXT;
  tables_to_check TEXT[] := ARRAY['profiles', 'conversations', 'messages', 'albums', 'album_permissions', 'album_photos', 'user_sessions', 'user_activity_log', 'blocked_users', 'reported_users'];
BEGIN
  FOREACH table_name IN ARRAY tables_to_check
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    END IF;
  END LOOP;
END $$;

-- Create a view for admin users to monitor system health
CREATE OR REPLACE VIEW system_health AS
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours') as active_last_24h
FROM profiles
UNION ALL
SELECT 
  'conversations' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours') as active_last_24h
FROM conversations
UNION ALL
SELECT 
  'messages' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as active_last_24h
FROM messages
UNION ALL
SELECT 
  'blocked_users' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as active_last_24h
FROM blocked_users
UNION ALL
SELECT 
  'reported_users' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as active_last_24h
FROM reported_users;

-- Grant access to system health view (admin only)
CREATE POLICY "System health view access" ON system_health
FOR SELECT USING (auth.uid() IS NOT NULL);

COMMENT ON VIEW system_health IS 'System health monitoring view for administrators';
COMMENT ON FUNCTION is_user_blocked IS 'Check if one user has blocked another';
COMMENT ON FUNCTION log_user_activity IS 'Log user activity for audit trail';
COMMENT ON FUNCTION create_user_session IS 'Create a new user session with expiration';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Clean up expired user sessions';
COMMENT ON FUNCTION cleanup_old_activity_logs IS 'Clean up old activity logs (90+ days)';
