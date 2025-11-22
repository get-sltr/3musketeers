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
      const backendUrl = process.env.NODE_ENV === 'development'
        ? (process.env.NEXT_PUBLIC_DEV_BACKEND_URL || 'http://localhost:3001')
        : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.getsltr.com');
      this.baseUrl = `${backendUrl}/api/v1`;
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
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error || !session?.access_token) {
        console.warn('No Supabase session:', error?.message);
        return null;
      }
      return session.access_token;
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
        
        // If 401, user might need to log in again
        if (response.status === 401) {
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
    return this.request('/heartbeat', {
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
    return this.request('/activity/status');
  }

  /**
   * Get activity stats (admin)
   */
  async getActivityStats(): Promise<any> {
    return this.request('/activity/stats');
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
    return this.request(`/matches/daily?limit=${limit}`);
  }

  /**
   * Get match recommendations
   */
  async getRecommendations(criteria?: any): Promise<{
    success: boolean;
    data: any[];
  }> {
    return this.request('/matches/recommendations', {
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
    return this.request(`/matches/${matchId}/action`, {
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
    return this.request('/assistant/chat', {
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
    return this.request('/assistant/ask', {
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
    return this.request('/assistant/translate', {
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
    return this.request('/assistant/advice', {
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
    return this.request('/users/profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: any): Promise<{
    success: boolean;
    profile: any;
  }> {
    return this.request('/users/profile', {
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
    return this.request(`/users/${userId}/profile`);
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
