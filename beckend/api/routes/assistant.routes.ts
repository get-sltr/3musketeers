import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Logger } from 'winston';
import { createLogger } from '../../shared/utils/logger';
import { DatabaseClient } from '../../shared/database/client';
import { CacheManager } from '../../shared/services/cache-manager';
import { ActivityTracker } from '../../shared/services/activity-tracker';

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  success: boolean;
  conversationId: string;
  response: string;
  intent?: string;
  suggestedActions?: Array<{ type: string; label: string; description?: string }>;
  error?: string;
}

/**
 * Lightweight AI Assistant Routes
 * Handles real-time chat, questions, translations, dating advice
 * No heavy analysis - only during peak hours
 */
export class AssistantRoutes {
  private logger: Logger;
  private db: DatabaseClient;
  private cache: CacheManager;
  private activityTracker: ActivityTracker;

  constructor(db: DatabaseClient, cache: CacheManager, activityTracker: ActivityTracker) {
    this.logger = createLogger('AssistantRoutes');
    this.db = db;
    this.cache = cache;
    this.activityTracker = activityTracker;
  }

  public registerRoutes(fastify: FastifyInstance, prefix: string): void {
    // General chat endpoint
    fastify.post(`${prefix}/assistant/chat`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleChat(request, reply);
    });

    // Ask questions endpoint
    fastify.post(`${prefix}/assistant/ask`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleAsk(request, reply);
    });

    // Translation endpoint
    fastify.post(`${prefix}/assistant/translate`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleTranslate(request, reply);
    });

    // Dating advice endpoint
    fastify.post(`${prefix}/assistant/advice`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleAdvice(request, reply);
    });

    // Get conversation history
    fastify.get(`${prefix}/assistant/conversations/:conversationId`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.getConversation(request, reply);
    });

    this.logger.info('Assistant routes registered');
  }

  /**
   * Handle general chat
   */
  private async handleChat(request: FastifyRequest, reply: FastifyReply): Promise<ChatResponse> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, conversationId: '', response: '', error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const { message, conversationId } = request.body as ChatRequest;

      if (!message || message.trim().length === 0) {
        reply.code(400);
        return { success: false, conversationId: '', response: '', error: 'Message cannot be empty' };
      }

      // Generate or use existing conversation ID
      const convId = conversationId || this.generateConversationId(userId);

      // Record activity
      this.activityTracker.recordActivity(userId);

      // Save message to database
      await this.db.getClient()
        .from('eros_conversations')
        .insert({
          user_id: userId,
          conversation_id: convId,
          message,
          role: 'user',
          created_at: new Date()
        });

      // Generate lightweight response (no heavy analysis)
      const response = this.generateLightweightResponse(message);
      const intent = this.classifySimpleIntent(message);

      // Save assistant response
      await this.db.getClient()
        .from('eros_conversations')
        .insert({
          user_id: userId,
          conversation_id: convId,
          message: response,
          role: 'assistant',
          intent_category: intent,
          created_at: new Date()
        });

      this.logger.debug('Chat message processed', { userId, conversationId: convId });

      return {
        success: true,
        conversationId: convId,
        response,
        intent,
        suggestedActions: this.getSuggestedActions(intent)
      };
    } catch (error) {
      this.logger.error('Chat error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, conversationId: '', response: '', error: 'Chat failed' };
    }
  }

  /**
   * Handle general knowledge questions
   */
  private async handleAsk(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const { question } = request.body as { question: string };

      if (!question) {
        reply.code(400);
        return { success: false, error: 'Question required' };
      }

      // Record activity
      this.activityTracker.recordActivity(userId);

      // Generate lightweight answer (could integrate with LLM API here)
      const answer = this.generateAnswer(question);

      this.logger.debug('Question answered', { userId });

      return {
        success: true,
        question,
        answer
      };
    } catch (error) {
      this.logger.error('Ask error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, error: 'Failed to process question' };
    }
  }

  /**
   * Handle translation requests
   */
  private async handleTranslate(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const { text, targetLanguage } = request.body as { text: string; targetLanguage: string };

      if (!text || !targetLanguage) {
        reply.code(400);
        return { success: false, error: 'Text and target language required' };
      }

      // Record activity
      this.activityTracker.recordActivity(userId);

      // Simple translation (could integrate with translation API)
      const translated = `[${targetLanguage}] ${text}`;

      this.logger.debug('Translation processed', { userId, language: targetLanguage });

      return {
        success: true,
        original: text,
        translated,
        targetLanguage
      };
    } catch (error) {
      this.logger.error('Translation error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, error: 'Translation failed' };
    }
  }

  /**
   * Handle dating advice requests
   */
  private async handleAdvice(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const { topic, context } = request.body as { topic: string; context?: string };

      if (!topic) {
        reply.code(400);
        return { success: false, error: 'Topic required' };
      }

      // Record activity
      this.activityTracker.recordActivity(userId);

      // Generate advice based on topic
      const advice = this.generateAdvice(topic, context);

      this.logger.debug('Advice generated', { userId, topic });

      return {
        success: true,
        topic,
        advice
      };
    } catch (error) {
      this.logger.error('Advice error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, error: 'Failed to generate advice' };
    }
  }

  /**
   * Get conversation history
   */
  private async getConversation(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      if (!request.user) {
        reply.code(401);
        return { success: false, error: 'Unauthorized' };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;
      const conversationId = (request.params as any).conversationId;

      // Try cache first
      const cached = await this.cache.getConversation(userId, conversationId);
      if (cached) {
        return { success: true, messages: cached, source: 'cache' };
      }

      // Get from database
      const { data: messages, error } = await this.db.getClient()
        .from('eros_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        reply.code(500);
        return { success: false, error: 'Failed to fetch conversation' };
      }

      // Cache it
      if (messages && messages.length > 0) {
        await this.cache.setConversation(userId, conversationId, messages);
      }

      return {
        success: true,
        conversationId,
        messages: messages || [],
        source: 'database'
      };
    } catch (error) {
      this.logger.error('Get conversation error', {
        error: error instanceof Error ? error.message : String(error)
      });
      reply.code(500);
      return { success: false, error: 'Failed to fetch conversation' };
    }
  }

  /**
   * Generate simple intent classification
   */
  private classifySimpleIntent(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('advice') || lower.includes('help')) return 'advice_request';
    if (lower.includes('profile') || lower.includes('update')) return 'profile_update';
    if (lower.includes('match') || lower.includes('recommend')) return 'match_inquiry';
    if (lower.includes('hello') || lower.includes('hi')) return 'greeting';
    if (lower.includes('translate') || lower.includes('language')) return 'translation';

    return 'general';
  }

  /**
   * Generate lightweight response (no ML inference)
   */
  private generateLightweightResponse(message: string): string {
    const intent = this.classifySimpleIntent(message);

    const responses: Record<string, string> = {
      greeting: "Hello! I'm EROS, your dating companion. How can I help you today?",
      advice_request: "I'd be happy to help! Could you tell me more about what you need advice on?",
      profile_update: "You can update your profile in the settings. Want tips on making it more appealing?",
      match_inquiry: "Your daily matches are ready! Check your matches section to see them.",
      translation: "I can help translate! Let me know what you'd like translated.",
      general: "That's interesting! Tell me more, and I'll do my best to help."
    };

    return responses[intent] || responses.general;
  }

  /**
   * Generate dating advice
   */
  private generateAdvice(topic: string, context?: string): string {
    const adviceMap: Record<string, string> = {
      'first_message': 'Start with a genuine compliment based on their profile, then ask an open-ended question about their interests.',
      'profile_photo': 'Use a clear, recent photo where you\'re smiling. Natural lighting works best!',
      'conversation': 'Ask questions that show you\'ve read their profile. People appreciate genuine interest.',
      'first_date': 'Choose a public place like a coffee shop. Keep it casual and fun.',
      'safety': 'Always meet in public places, tell a friend where you\'re going, and trust your gut.'
    };

    return adviceMap[topic] || `Here's some advice on ${topic}: Be genuine, respectful, and have fun!`;
  }

  /**
   * Generate answer to general question
   */
  private generateAnswer(question: string): string {
    // Simple template-based answers
    if (question.toLowerCase().includes('how')) {
      return 'Great question! Here\'s what I know about that...';
    }
    if (question.toLowerCase().includes('why')) {
      return 'That\'s a good question. The reason is...';
    }
    if (question.toLowerCase().includes('what')) {
      return 'Good question! It\'s basically...';
    }

    return 'I\'m here to help! Let me think about that...';
  }

  /**
   * Get suggested actions based on intent
   */
  private getSuggestedActions(intent: string): Array<{ type: string; label: string; description?: string }> {
    const actions: Record<string, Array<{ type: string; label: string; description?: string }>> = {
      match_inquiry: [
        { type: 'view_profile', label: 'View Matches', description: 'Check your daily matches' },
        { type: 'send_message', label: 'Send Message', description: 'Message someone' }
      ],
      advice_request: [
        { type: 'update_preferences', label: 'Update Preferences', description: 'Adjust what you\'re looking for' }
      ],
      profile_update: [
        { type: 'upload_photo', label: 'Add Photo', description: 'Upload a new photo' }
      ],
      greeting: [
        { type: 'view_profile', label: 'Browse Profiles', description: 'See who\'s out there' }
      ]
    };

    return actions[intent] || [];
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(userId: string): string {
    return `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
