export interface ErosConversation {
  id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant' | 'system';
  conversation_context: Record<string, any>;
  intent_category: string | null;
  created_at: Date;
}

export interface ChatRequest {
  user_id: string;
  message: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  intent_category?: string;
  conversation_id: string;
}

export interface DailyMatch {
  id: string;
  user_id: string;
  match_user_id: string;
  rank: number;
  compatibility_score: number;
  eros_insight: string;
  match_date: string;
  profile?: any;
}
