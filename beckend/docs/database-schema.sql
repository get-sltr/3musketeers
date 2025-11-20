-- ============================================
-- EROS CORE TABLES
-- ============================================

-- Users table (if not using Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  bio TEXT,
  photos JSONB DEFAULT '[]',
  location JSONB,
  interests TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_location ON users(latitude, longitude);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================
-- EROS ANALYSIS TABLES
-- ============================================

-- User profiles with behavioral analysis
CREATE TABLE IF NOT EXISTS eros_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Behavioral Metrics
  favorite_count INTEGER DEFAULT 0,
  block_count INTEGER DEFAULT 0,
  message_thread_count INTEGER DEFAULT 0,
  avg_response_time_minutes DECIMAL(10, 2),
  avg_conversation_length DECIMAL(10, 2),
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  
  -- Preference Patterns
  physical_type_preferences JSONB,
  red_flags JSONB DEFAULT '[]',
  conversation_style JSONB,
  engagement_patterns JSONB,
  
  -- Activity Scores
  activity_score INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 0,
  
  -- Analysis Metadata
  analysis_version INTEGER DEFAULT 1,
  last_analyzed_at TIMESTAMP,
  next_analysis_scheduled_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_eros_user_profiles_user_id ON eros_user_profiles(user_id);
CREATE INDEX idx_eros_user_profiles_activity_score ON eros_user_profiles(activity_score);
CREATE INDEX idx_eros_user_profiles_next_analysis ON eros_user_profiles(next_analysis_scheduled_at);

-- Match scores
CREATE TABLE IF NOT EXISTS eros_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Scoring
  compatibility_score DECIMAL(5, 2) NOT NULL,
  confidence_level DECIMAL(5, 2),
  
  -- Breakdown
  score_breakdown JSONB NOT NULL,
  match_reasoning TEXT,
  ai_model_version VARCHAR(50),
  
  -- Validity
  computed_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_match_score UNIQUE(user_id, target_user_id)
);

CREATE INDEX idx_eros_match_scores_user_id ON eros_match_scores(user_id);
CREATE INDEX idx_eros_match_scores_is_valid ON eros_match_scores(is_valid);
CREATE INDEX idx_eros_match_scores_expires_at ON eros_match_scores(expires_at);

-- Daily matches
CREATE TABLE IF NOT EXISTS eros_daily_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ranking
  rank INTEGER NOT NULL,
  compatibility_score DECIMAL(5, 2),
  
  -- Insights
  eros_insight TEXT,
  insight_category VARCHAR(100),
  
  -- Engagement
  match_date DATE NOT NULL,
  delivered_at TIMESTAMP DEFAULT NOW(),
  viewed_at TIMESTAMP,
  action_taken VARCHAR(50),
  action_taken_at TIMESTAMP,
  
  -- Performance
  impression_duration_seconds INTEGER,
  conversion_type VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_eros_daily_matches_user_id ON eros_daily_matches(user_id);
CREATE INDEX idx_eros_daily_matches_match_date ON eros_daily_matches(match_date);
CREATE INDEX idx_eros_daily_matches_user_date ON eros_daily_matches(user_id, match_date);

-- Analysis queue
CREATE TABLE IF NOT EXISTS eros_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  
  -- Scheduling
  queued_at TIMESTAMP DEFAULT NOW(),
  scheduled_for TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Processing
  worker_id VARCHAR(255),
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Errors
  error_message TEXT,
  error_stack TEXT,
  last_error_at TIMESTAMP,
  
  -- Metadata
  job_metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_eros_analysis_queue_status ON eros_analysis_queue(status);
CREATE INDEX idx_eros_analysis_queue_user_id ON eros_analysis_queue(user_id);
CREATE INDEX idx_eros_analysis_queue_priority ON eros_analysis_queue(priority);
CREATE INDEX idx_eros_analysis_queue_scheduled ON eros_analysis_queue(scheduled_for);

-- ============================================
-- EROS CONVERSATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS eros_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id VARCHAR(255),
  
  -- Message
  message TEXT NOT NULL,
  role VARCHAR(50) NOT NULL,
  
  -- Context
  conversation_context JSONB DEFAULT '{}',
  intent_category VARCHAR(100),
  
  -- AI Metadata
  ai_model VARCHAR(100),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_eros_conversations_user_id ON eros_conversations(user_id);
CREATE INDEX idx_eros_conversations_conversation_id ON eros_conversations(conversation_id);
CREATE INDEX idx_eros_conversations_created_at ON eros_conversations(created_at);

-- ============================================
-- BLOCKING & INTERACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_block UNIQUE(user_id, blocked_user_id)
);

CREATE INDEX idx_blocks_user_id ON blocks(user_id);
CREATE INDEX idx_blocks_blocked_user_id ON blocks(blocked_user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to invalidate expired match scores
CREATE OR REPLACE FUNCTION invalidate_expired_scores()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE eros_match_scores
  SET is_valid = FALSE,
      updated_at = NOW()
  WHERE expires_at < NOW() AND is_valid = TRUE;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old completed queue items
CREATE OR REPLACE FUNCTION cleanup_old_queue_items(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  DELETE FROM eros_analysis_queue
  WHERE status IN ('completed', 'cancelled')
    AND completed_at < NOW() - INTERVAL '1 day' * days_old;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamp on profile
CREATE OR REPLACE FUNCTION update_eros_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamp on match scores
CREATE OR REPLACE FUNCTION update_eros_match_score_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamp on queue
CREATE OR REPLACE FUNCTION update_eros_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_eros_profile_timestamp ON eros_user_profiles;
CREATE TRIGGER trigger_update_eros_profile_timestamp
  BEFORE UPDATE ON eros_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_eros_profile_timestamp();

DROP TRIGGER IF EXISTS trigger_update_match_score_timestamp ON eros_match_scores;
CREATE TRIGGER trigger_update_match_score_timestamp
  BEFORE UPDATE ON eros_match_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_eros_match_score_timestamp();

DROP TRIGGER IF EXISTS trigger_update_queue_timestamp ON eros_analysis_queue;
CREATE TRIGGER trigger_update_queue_timestamp
  BEFORE UPDATE ON eros_analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_eros_queue_timestamp();

-- ============================================
-- SCHEDULED JOBS (run these periodically)
-- ============================================

-- Call this daily to invalidate expired scores
-- SELECT invalidate_expired_scores();

-- Call this weekly to clean up old queue items
-- SELECT cleanup_old_queue_items(7);
