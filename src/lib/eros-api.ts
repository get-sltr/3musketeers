/**
 * EROS API Client
 * Handles all communication with the EROS backend
 * Manages authentication, requests, and error handling
 */

import { createClient } from '@/lib/supabase/client';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class ErosAPIClient {
  private baseUrl: string;
  private supabase = typeof window !== 'undefined' ? createClient() : null;

  constructor(baseUrl?: string) {
    // Build base URL from environment variables
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else {
      // EROS backend base URL (endpoints use /api/v1 prefix)
      this.baseUrl = process.env.NODE_ENV === 'development'
        ? (process.env.NEXT_PUBLIC_DEV_BACKEND_URL || 'http://localhost:3001')
        : (process.env.NEXT_PUBLIC_EROS_BACKEND_URL || 'https://eros-backend-production.up.railway.app');
    }
  }

  /**
   * Get Supabase access token from session
   */
  private async getAccessToken(): Promise<string | null> {
    if (!this.supabase || typeof window === 'undefined') {
      return null;
    }

    try {
      // Try getSession first (faster, uses cached session)
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (session?.access_token) {
        return session.access_token;
      }

      // If no session, try getUser (forces refresh)
      if (sessionError || !session) {
        const { data: { user }, error: userError } = await this.supabase.auth.getUser();
        
        if (userError) {
          console.warn('No authenticated user:', userError.message);
          return null;
        }

        // If user exists but no session token, try to get session again
        const { data: { session: newSession } } = await this.supabase.auth.getSession();
        if (newSession?.access_token) {
          return newSession.access_token;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get fresh token from Supabase session
    const token = await this.getAccessToken();
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...config.headers,
    };

    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error || `API error: ${response.status}`;
        
        // If 401, try to refresh the session and retry once
        if (response.status === 401) {
          console.warn('401 error, attempting to refresh session...');
          
          // Try to refresh the session
          if (this.supabase) {
            try {
              const { data: { session: newSession }, error: refreshError } = await this.supabase.auth.refreshSession();
              
              if (!refreshError && newSession?.access_token) {
                // Retry the request with new token
                const retryHeaders = {
                  ...headers,
                  'Authorization': `Bearer ${newSession.access_token}`
                };
                
                const retryResponse = await fetch(url, {
                  method: config.method || 'GET',
                  headers: retryHeaders,
                  body: config.body ? JSON.stringify(config.body) : undefined,
                });
                
                if (retryResponse.ok) {
                  return await retryResponse.json();
                }
              }
            } catch (refreshErr) {
              console.error('Session refresh failed:', refreshErr);
            }
          }
          
          throw new Error('Authentication required. Please log in.');
        }
        
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ========== HEARTBEAT / ACTIVITY ==========

  /**
   * Send heartbeat to track user activity
   */
  async sendHeartbeat(appActive: boolean = true, screenOn: boolean = true): Promise<{
    success: boolean;
    idleTime: number;
    processingPhase: 'active' | 'phase1' | 'phase2' | 'phase3';
    timestamp: string;
  }> {
    return this.request('/api/v1/heartbeat', {
      method: 'POST',
      body: { appActive, screenOn },
    });
  }

  /**
   * Get current activity status
   */
  async getActivityStatus(): Promise<{
    userId: string;
    lastInteraction: string;
    idleTime: number;
    processingPhase: 'active' | 'phase1' | 'phase2' | 'phase3';
    sessionDuration: number;
  }> {
    return this.request('/api/v1/activity/status');
  }

  /**
   * Get activity stats (admin)
   */
  async getActivityStats(): Promise<any> {
    return this.request('/api/v1/activity/stats');
  }

  // ========== MATCHES ==========

  /**
   * Get daily matches
   */
  async getDailyMatches(limit: number = 10): Promise<{
    success: boolean;
    matches: any[];
    count?: number;
    source?: string;
    date?: string;
  }> {
    return this.request(`/api/v1/matches/daily?limit=${limit}`);
  }

  /**
   * Get match recommendations
   */
  async getRecommendations(criteria?: any): Promise<{
    success: boolean;
    data: any[];
  }> {
    return this.request('/api/v1/matches/recommendations', {
      method: 'POST',
      body: criteria || {},
    });
  }

  /**
   * Perform action on match (like, skip, block)
   */
  async actionOnMatch(
    matchId: string,
    action: 'like' | 'skip' | 'block' | 'report',
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request(`/api/v1/matches/${matchId}/action`, {
      method: 'POST',
      body: { action, reason },
    });
  }

  // ========== ASSISTANT / CHAT ==========

  /**
   * Chat with EROS AI
   */
  async chat(message: string, context?: any): Promise<{
    success: boolean;
    response: string;
    intent?: string;
    confidence?: number;
  }> {
    return this.request('/api/v1/assistant/chat', {
      method: 'POST',
      body: { message, context },
    });
  }

  /**
   * Ask EROS a question
   */
  async ask(question: string, topic?: string): Promise<{
    success: boolean;
    answer: string;
    sources?: string[];
  }> {
    return this.request('/api/v1/assistant/ask', {
      method: 'POST',
      body: { question, topic },
    });
  }

  /**
   * Translate message with EROS
   */
  async translate(text: string, targetLanguage: string): Promise<{
    success: boolean;
    translated: string;
    language: string;
  }> {
    return this.request('/api/v1/assistant/translate', {
      method: 'POST',
      body: { text, targetLanguage },
    });
  }

  /**
   * Get dating advice from EROS
   */
  async getAdvice(topic: string, context?: string): Promise<{
    success: boolean;
    advice: string;
    actionItems?: string[];
  }> {
    return this.request('/api/v1/assistant/advice', {
      method: 'POST',
      body: { topic, context },
    });
  }

  // ========== PROFILE ==========

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<{
    success: boolean;
    profile: any;
  }> {
    return this.request('/api/v1/users/profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: any): Promise<{
    success: boolean;
    profile: any;
  }> {
    return this.request('/api/v1/users/profile', {
      method: 'PUT',
      body: updates,
    });
  }

  /**
   * Get another user's profile
   */
  async getUserProfileById(userId: string): Promise<{
    success: boolean;
    profile: any;
  }> {
    return this.request(`/api/v1/users/${userId}/profile`);
  }

  // ========== HEALTH ==========

  /**
   * Check API health
   */
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
  }> {
      // Extract base backend URL (remove /api/v1)
      const healthUrl = this.baseUrl.replace('/api/v1', '') + '/api/health';
      return fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      .then(r => r.json())
      .catch(() => ({ status: 'down', timestamp: new Date().toISOString(), uptime: 0 }));
  }
}

// Export singleton instance
export const erosAPI = new ErosAPIClient();

// Export class for testing
export default ErosAPIClient;
