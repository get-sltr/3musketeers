-- EROS Tables Migration - 2025-11-20
-- Simple tables without FK constraints (add later if needed)

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  matched_user_id UUID NOT NULL,
  match_type VARCHAR(50) DEFAULT 'daily',
  compatibility_score FLOAT DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS match_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  match_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  response TEXT,
  intent VARCHAR(100),
  confidence FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_actions_user_id ON match_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_actions_match_id ON match_actions(match_id);
CREATE INDEX IF NOT EXISTS idx_assistant_user_id ON assistant_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_created_at ON assistant_conversations(created_at DESC);
