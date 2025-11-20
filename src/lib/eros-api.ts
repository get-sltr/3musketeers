/**
 * EROS API Client
 * Handles all communication with the EROS backend
 * Manages authentication, requests, and error handling
 */

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
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string = process.env.VITE_API_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_DEV_BACKEND_URL || 'http://localhost:3000'}/api/v1`) {
    this.baseUrl = baseUrl;
    this.loadTokenFromStorage();
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('eros_access_token');
      this.refreshToken = localStorage.getItem('eros_refresh_token');
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokensToStorage(accessToken: string, refreshToken?: string): void {
    if (typeof window !== 'undefined') {
      this.token = accessToken;
      localStorage.setItem('eros_access_token', accessToken);
      if (refreshToken) {
        this.refreshToken = refreshToken;
        localStorage.setItem('eros_refresh_token', refreshToken);
      }
    }
  }

  /**
   * Clear tokens from storage and memory
   */
  private clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eros_access_token');
      localStorage.removeItem('eros_refresh_token');
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      // Handle token expiration
      if (response.status === 401 && this.refreshToken) {
        await this.refreshAccessToken();
        // Retry request with new token
        return this.request<T>(endpoint, config);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `API error: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      this.clearTokens();
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`,
        },
      });

      if (!response.ok) {
        this.clearTokens();
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.saveTokensToStorage(data.accessToken, data.refreshToken);
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Set authentication token (called after login)
   */
  public setTokens(accessToken: string, refreshToken?: string): void {
    this.saveTokensToStorage(accessToken, refreshToken);
  }

  /**
   * Clear authentication
   */
  public logout(): void {
    this.clearTokens();
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
    data: any[];
    total: number;
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
    return fetch(`${this.baseUrl}/..health`, {
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
