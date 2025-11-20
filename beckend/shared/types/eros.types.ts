// shared/types/eros.types.ts

/**
 * Core EROS type definitions
 * Version: 1.0.0
 */

// ============================================
// ENUMS
// ============================================

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum AnalysisPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export enum MatchActionType {
  VIEWED = 'viewed',
  MESSAGED = 'messaged',
  FAVORITED = 'favorited',
  IGNORED = 'ignored',
  BLOCKED = 'blocked'
}

// ============================================
// DATABASE MODELS
// ============================================

export interface ErosUserProfile {
  id: string;
  user_id: string;

  // Behavioral Metrics
  favorite_count: number;
  block_count: number;
  message_thread_count: number;
  avg_response_time_minutes: number | null;
  avg_conversation_length: number | null;
  total_messages_sent: number;
  total_messages_received: number;

  // Preference Patterns
  physical_type_preferences: PhysicalTypePreferences;
  red_flags: RedFlag[];
  conversation_style: ConversationStyle;
  engagement_patterns: EngagementPatterns;

  // Activity Scores
  activity_score: number;
  quality_score: number;

  // Analysis Metadata
  analysis_version: number;
  last_analyzed_at: Date | null;
  next_analysis_scheduled_at: Date | null;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface ErosMatchScore {
  id: string;
  user_id: string;
  target_user_id: string;

  // Scoring
  compatibility_score: number;
  confidence_level: number;

  // Breakdown
  score_breakdown: ScoreBreakdown;
  match_reasoning: string | null;
  ai_model_version: string | null;

  // Validity
  computed_at: Date;
  expires_at: Date;
  is_valid: boolean;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface ErosDailyMatch {
  id: string;
  user_id: string;
  match_user_id: string;

  // Ranking
  rank: number;
  compatibility_score: number;

  // Insights
  eros_insight: string;
  insight_category: string | null;

  // Engagement
  match_date: string; // ISO date string
  delivered_at: Date;
  viewed_at: Date | null;
  action_taken: MatchActionType | null;
  action_taken_at: Date | null;

  // Performance
  impression_duration_seconds: number | null;
  conversion_type: string | null;

  // Timestamps
  created_at: Date;
}

export interface ErosAnalysisQueue {
  id: string;
  user_id: string;

  // Status
  status: AnalysisStatus;
  priority: AnalysisPriority;

  // Scheduling
  queued_at: Date;
  scheduled_for: Date;
  started_at: Date | null;
  completed_at: Date | null;

  // Processing
  worker_id: string | null;
  attempt_count: number;
  max_attempts: number;

  // Errors
  error_message: string | null;
  error_stack: string | null;
  last_error_at: Date | null;

  // Metadata
  job_metadata: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface ErosConversation {
  id: string;
  user_id: string;

  // Message
  message: string;
  role: MessageRole;

  // Context
  conversation_context: Record<string, any>;
  intent_category: string | null;

  // AI Metadata
  ai_model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;

  // Timestamps
  created_at: Date;
}

// ============================================
// NESTED TYPES
// ============================================

export interface PhysicalTypePreferences {
  age_range?: {
    min: number;
    max: number;
  };
  body_types?: string[];
  ethnicities?: string[];
  heights?: {
    min: number; // in cm
    max: number;
  };
  common_attributes?: string[]; // Tags like "athletic", "tattooed", etc.
  confidence_score?: number;
}

export interface RedFlag {
  attribute: string;
  severity: 'low' | 'medium' | 'high';
  occurrences: number;
  last_seen: Date;
}

export interface ConversationStyle {
  avg_message_length?: number;
  response_speed?: 'very_fast' | 'fast' | 'moderate' | 'slow';
  tone?: 'formal' | 'casual' | 'flirty' | 'direct';
  emoji_usage?: 'none' | 'light' | 'moderate' | 'heavy';
  conversation_depth?: 'shallow' | 'moderate' | 'deep';
}

export interface EngagementPatterns {
  peak_activity_hours?: number[]; // Hours of day (0-23)
  avg_session_duration_minutes?: number;
  days_active_per_week?: number;
  favorite_features?: string[];
}

export interface ScoreBreakdown {
  physical_attraction: number;
  conversation_compatibility: number;
  interest_alignment: number;
  activity_pattern_match: number;
  geographic_proximity: number;
  [key: string]: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface AnalyzeUserRequest {
  user_id: string;
  priority?: AnalysisPriority;
  force_reanalysis?: boolean;
}

export interface AnalyzeUserResponse {
  success: boolean;
  job_id: string;
  estimated_completion_time?: Date;
  message?: string;
}

export interface GetDailyMatchesRequest {
  user_id: string;
  date?: string; // ISO date string
  limit?: number;
}

export interface GetDailyMatchesResponse {
  success: boolean;
  matches: DailyMatchWithProfile[];
  total_count: number;
  delivered_at: Date;
}

export interface DailyMatchWithProfile extends ErosDailyMatch {
  profile: UserProfile; // Your existing user profile type
}

export interface ChatWithErosRequest {
  user_id: string;
  message: string;
  conversation_history?: ErosConversation[];
}

export interface ChatWithErosResponse {
  success: boolean;
  response: string;
  intent_category?: string;
  suggested_actions?: SuggestedAction[];
  conversation_id: string;
}

export interface SuggestedAction {
  type: 'view_profile' | 'send_message' | 'favorite' | 'update_preferences';
  target_user_id?: string;
  label: string;
  description?: string;
}

export interface GetMatchScoresRequest {
  user_id: string;
  min_score?: number;
  limit?: number;
  include_expired?: boolean;
}

export interface GetMatchScoresResponse {
  success: boolean;
  scores: MatchScoreWithProfile[];
  total_count: number;
}

export interface MatchScoreWithProfile extends ErosMatchScore {
  profile: UserProfile;
}

// ============================================
// SERVICE TYPES
// ============================================

export interface AnalysisResult {
  user_id: string;
  profile_data: Partial<ErosUserProfile>;
  match_scores: Omit<ErosMatchScore, 'id' | 'created_at' | 'updated_at'>[];
  analysis_duration_ms: number;
  errors?: string[];
}

export interface MatchGenerationConfig {
  min_compatibility_score: number;
  max_matches_per_user: number;
  geographic_radius_km: number;
  score_expiry_hours: number;
  weights: ScoreBreakdown;
}

export interface WorkerConfig {
  worker_id: string;
  max_concurrent_jobs: number;
  poll_interval_ms: number;
  job_timeout_ms: number;
  retry_strategy: RetryStrategy;
}

export interface RetryStrategy {
  max_attempts: number;
  backoff_multiplier: number;
  initial_delay_ms: number;
  max_delay_ms: number;
}

// ============================================
// ERROR TYPES
// ============================================

export class ErosError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ErosError';
  }
}

export class AnalysisError extends ErosError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'ANALYSIS_ERROR', 500, details);
    this.name = 'AnalysisError';
  }
}

export class MatchScoringError extends ErosError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'MATCH_SCORING_ERROR', 500, details);
    this.name = 'MatchScoringError';
  }
}

export class QueueError extends ErosError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'QUEUE_ERROR', 500, details);
    this.name = 'QueueError';
  }
}
