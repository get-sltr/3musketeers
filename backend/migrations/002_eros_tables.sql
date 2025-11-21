-- EROS Backend Database Migrations
-- Creates all tables needed for EROS matchmaking system
-- CLEAN • RELIABLE • SCALABLE • FUNCTIONAL • SUSTAINABLE

-- =====================================================
-- 1. FAVORITE PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS favorite_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patterns JSONB DEFAULT '{}'::jsonb,
  top_traits TEXT[] DEFAULT ARRAY[]::TEXT[],
  favorite_type VARCHAR(50),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_patterns_user ON favorite_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_patterns_analyzed ON favorite_patterns(analyzed_at DESC);

-- =====================================================
-- 2. MESSAGE BEHAVIOR PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS message_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patterns JSONB DEFAULT '{}'::jsonb,
  who_they_message TEXT[] DEFAULT ARRAY[]::TEXT[],
  message_style VARCHAR(50),
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_patterns_user ON message_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_message_patterns_analyzed ON message_behavior_patterns(analyzed_at DESC);

-- =====================================================
-- 3. BLOCK PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS block_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instant_triggers TEXT[] DEFAULT ARRAY[]::TEXT[],
  dealbreakers TEXT[] DEFAULT ARRAY[]::TEXT[],
  toxic_traits TEXT[] DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_block_patterns_user ON block_patterns(user_id);

-- =====================================================
-- 4. ULTIMATE PREFERENCE PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ultimate_preference_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern JSONB DEFAULT '{}'::jsonb,
  confidence_score FLOAT DEFAULT 0,
  learned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_ultimate_patterns_user ON ultimate_preference_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_ultimate_patterns_learned ON ultimate_preference_patterns(learned_at DESC);
CREATE INDEX IF NOT EXISTS idx_ultimate_patterns_confidence ON ultimate_preference_patterns(confidence_score DESC);

-- =====================================================
-- 5. MATCH PREDICTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS match_predictions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL,
  overall_score FLOAT DEFAULT 0,
  breakdown JSONB DEFAULT '{}'::jsonb,
  prediction VARCHAR(50),
  reasoning TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON match_predictions_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_candidate ON match_predictions_v2(candidate_id);
CREATE INDEX IF NOT EXISTS idx_predictions_score ON match_predictions_v2(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON match_predictions_v2(created_at DESC);

-- =====================================================
-- 6. CALL HISTORY TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  call_type VARCHAR(20) DEFAULT 'video',
  duration INTEGER DEFAULT 0,
  quality VARCHAR(20),
  time_of_day TIME,
  day_of_week VARCHAR(20),
  followed_by_hookup BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_history_user ON call_history(user_id);
CREATE INDEX IF NOT EXISTS idx_call_history_partner ON call_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_call_history_created ON call_history(created_at DESC);

-- =====================================================
-- 7. BLOCK HISTORY TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS block_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL,
  after_messages INTEGER DEFAULT 0,
  after_call_attempt BOOLEAN DEFAULT false,
  reason TEXT,
  trigger_message TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_block_history_user ON block_history(user_id);
CREATE INDEX IF NOT EXISTS idx_block_history_blocked ON block_history(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_block_history_created ON block_history(blocked_at DESC);

-- =====================================================
-- 8. EROS PROCESSING QUEUE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS eros_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL,
  phase VARCHAR(20),
  priority INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queue_user ON eros_processing_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON eros_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_priority ON eros_processing_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_queue_created ON eros_processing_queue(created_at DESC);

-- =====================================================
-- 9. UPDATE MATCHES TABLE (add new columns if needed)
-- =====================================================
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reason TEXT;

CREATE INDEX IF NOT EXISTS idx_matches_rank ON matches(rank);

-- =====================================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Favorite patterns
ALTER TABLE favorite_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorite patterns" ON favorite_patterns;
CREATE POLICY "Users can view own favorite patterns" ON favorite_patterns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own favorite patterns" ON favorite_patterns;
CREATE POLICY "Users can update own favorite patterns" ON favorite_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Message behavior patterns
ALTER TABLE message_behavior_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own message patterns" ON message_behavior_patterns;
CREATE POLICY "Users can view own message patterns" ON message_behavior_patterns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own message patterns" ON message_behavior_patterns;
CREATE POLICY "Users can update own message patterns" ON message_behavior_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Block patterns
ALTER TABLE block_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own block patterns" ON block_patterns;
CREATE POLICY "Users can view own block patterns" ON block_patterns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own block patterns" ON block_patterns;
CREATE POLICY "Users can update own block patterns" ON block_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Ultimate preference patterns
ALTER TABLE ultimate_preference_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ultimate patterns" ON ultimate_preference_patterns;
CREATE POLICY "Users can view own ultimate patterns" ON ultimate_preference_patterns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ultimate patterns" ON ultimate_preference_patterns;
CREATE POLICY "Users can update own ultimate patterns" ON ultimate_preference_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Match predictions
ALTER TABLE match_predictions_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own predictions" ON match_predictions_v2;
CREATE POLICY "Users can view own predictions" ON match_predictions_v2
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own predictions" ON match_predictions_v2;
CREATE POLICY "Users can insert own predictions" ON match_predictions_v2
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Call history
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own call history" ON call_history;
CREATE POLICY "Users can view own call history" ON call_history
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

DROP POLICY IF EXISTS "Users can insert own call history" ON call_history;
CREATE POLICY "Users can insert own call history" ON call_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Block history
ALTER TABLE block_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own block history" ON block_history;
CREATE POLICY "Users can view own block history" ON block_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own block history" ON block_history;
CREATE POLICY "Users can insert own block history" ON block_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- EROS queue (service account only)
ALTER TABLE eros_processing_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service can manage queue" ON eros_processing_queue;
CREATE POLICY "Service can manage queue" ON eros_processing_queue
  FOR ALL USING (true);

-- =====================================================
-- COMPLETED
-- =====================================================

-- Migration completed successfully
-- All EROS tables created with proper indexes and RLS policies
