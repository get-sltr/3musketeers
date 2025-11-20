/**
 * EROS Analyzer Service
 * Offline user behavior analysis and preference extraction
 *
 * @module services/analyzer
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'winston';
import {
  ErosUserProfile,
  AnalysisResult,
  AnalysisError,
  PhysicalTypePreferences,
  RedFlag,
  ConversationStyle,
  EngagementPatterns
} from '../../shared/types/eros.types';
import { DataGatherer } from './data-gatherer';
import { PatternExtractor } from './pattern-extractor';
import { AIClient } from './ai-client';
import { createLogger } from '../../shared/utils/logger';
import { DatabaseClient } from '../../shared/database/client';

export interface AnalyzerConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  aiApiKey?: string;
  enableAIAnalysis: boolean;
  analysisTimeout: number;
  batchSize: number;
}

export class AnalyzerService {
  private db: DatabaseClient;
  private dataGatherer: DataGatherer;
  private patternExtractor: PatternExtractor;
  private aiClient: AIClient | null;
  private logger: Logger;

  constructor(private config: AnalyzerConfig) {
    this.logger = createLogger('AnalyzerService');
    this.db = new DatabaseClient(config.supabaseUrl, config.supabaseServiceKey);
    this.dataGatherer = new DataGatherer(this.db, this.logger);
    this.patternExtractor = new PatternExtractor(this.logger);
    this.aiClient = config.enableAIAnalysis && config.aiApiKey
      ? new AIClient(config.aiApiKey, this.logger)
      : null;

    this.logger.info('AnalyzerService initialized', {
      aiEnabled: config.enableAIAnalysis,
      timeout: config.analysisTimeout
    });
  }

  /**
   * Analyze a single user's behavior and preferences
   *
   * @param userId - UUID of user to analyze
   * @returns Analysis results with extracted patterns
   * @throws {AnalysisError} If analysis fails
   */
  public async analyzeUser(userId: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    this.logger.info('Starting user analysis', { userId });

    try {
      // Step 1: Gather raw behavioral data
      const userData = await this.dataGatherer.gatherUserData(userId);

      if (!userData) {
        throw new AnalysisError('User data not found', { userId });
      }

      // Step 2: Extract patterns from data
      const patterns = await this.extractPatterns(userId, userData);

      // Step 3: Calculate activity and quality scores
      const scores = this.calculateScores(userData);

      // Step 4: Build profile update
      const profileData: Partial<ErosUserProfile> = {
        user_id: userId,
        favorite_count: userData.favorites.length,
        block_count: userData.blocks.length,
        message_thread_count: userData.messageThreads.length,
        avg_response_time_minutes: patterns.avgResponseTime,
        avg_conversation_length: patterns.avgConversationLength,
        total_messages_sent: userData.totalMessagesSent,
        total_messages_received: userData.totalMessagesReceived,
        physical_type_preferences: patterns.physicalPreferences,
        red_flags: patterns.redFlags,
        conversation_style: patterns.conversationStyle,
        engagement_patterns: patterns.engagementPatterns,
        activity_score: scores.activityScore,
        quality_score: scores.qualityScore,
        last_analyzed_at: new Date(),
        next_analysis_scheduled_at: this.calculateNextAnalysis(scores.activityScore),
        analysis_version: 1
      };

      // Step 5: Save to database
      await this.saveAnalysisResults(userId, profileData);

      const duration = Date.now() - startTime;
      this.logger.info('User analysis completed', {
        userId,
        duration,
        activityScore: scores.activityScore,
        qualityScore: scores.qualityScore
      });

      return {
        user_id: userId,
        profile_data: profileData,
        match_scores: [], // Populated by matcher service
        analysis_duration_ms: duration
      };

    } catch (error) {
      this.logger.error('User analysis failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof AnalysisError) {
        throw error;
      }

      throw new AnalysisError(
        `Failed to analyze user ${userId}`,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Batch analyze multiple users
   *
   * @param userIds - Array of user UUIDs
   * @returns Array of analysis results
   */
  public async analyzeBatch(userIds: string[]): Promise<AnalysisResult[]> {
    this.logger.info('Starting batch analysis', { count: userIds.length });

    const results: AnalysisResult[] = [];
    const errors: Array<{ userId: string; error: string }> = [];

    // Process in batches to avoid overwhelming the system
    const batches = this.chunkArray(userIds, this.config.batchSize);

    for (const batch of batches) {
      const promises = batch.map(async (userId) => {
        try {
          return await this.analyzeUser(userId);
        } catch (error) {
          errors.push({
            userId,
            error: error instanceof Error ? error.message : String(error)
          });
          return null;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter((r): r is AnalysisResult => r !== null));
    }

    this.logger.info('Batch analysis completed', {
      total: userIds.length,
      successful: results.length,
      failed: errors.length
    });

    if (errors.length > 0) {
      this.logger.warn('Batch analysis had errors', { errors });
    }

    return results;
  }

  /**
   * Extract behavioral patterns from user data
   */
  private async extractPatterns(userId: string, userData: any) {
    // Extract physical type preferences from favorites
    const physicalPreferences = await this.patternExtractor.extractPhysicalPreferences(
      userData.favorites,
      userData.favoritedProfiles
    );

    // Extract red flags from blocks
    const redFlags = await this.patternExtractor.extractRedFlags(
      userData.blocks,
      userData.blockedProfiles
    );

    // Analyze conversation style
    const conversationStyle = await this.patternExtractor.analyzeConversationStyle(
      userData.messages
    );

    // Calculate engagement patterns
    const engagementPatterns = await this.patternExtractor.calculateEngagementPatterns(
      userData.activityLog
    );

    // Calculate response metrics
    const responseMetrics = this.patternExtractor.calculateResponseMetrics(
      userData.messageThreads
    );

    return {
      physicalPreferences,
      redFlags,
      conversationStyle,
      engagementPatterns,
      avgResponseTime: responseMetrics.avgResponseTime,
      avgConversationLength: responseMetrics.avgLength
    };
  }

  /**
   * Calculate activity and quality scores
   */
  private calculateScores(userData: any): { activityScore: number; qualityScore: number } {
    // Activity Score (0-100): Based on engagement frequency
    const activityScore = Math.min(100, (
      (userData.totalMessagesSent * 2) +
      (userData.favorites.length * 5) +
      (userData.profileViews * 0.5) +
      (userData.daysActiveLastWeek * 10)
    ) / 2);

    // Quality Score (0-100): Based on positive interactions
    const qualityScore = Math.min(100, (
      (userData.conversationsStarted * 5) +
      (userData.messagesReceived * 2) +
      (userData.mutualFavorites * 10) -
      (userData.blocks.length * 5) -
      (userData.reportedCount * 20)
    ));

    return {
      activityScore: Math.max(0, Math.round(activityScore)),
      qualityScore: Math.max(0, Math.round(qualityScore))
    };
  }

  /**
   * Calculate when next analysis should occur based on activity
   */
  private calculateNextAnalysis(activityScore: number): Date {
    // High activity users: analyze more frequently
    let hoursUntilNext: number;

    if (activityScore >= 80) {
      hoursUntilNext = 12; // Every 12 hours
    } else if (activityScore >= 50) {
      hoursUntilNext = 24; // Daily
    } else if (activityScore >= 20) {
      hoursUntilNext = 48; // Every 2 days
    } else {
      hoursUntilNext = 168; // Weekly
    }

    return new Date(Date.now() + hoursUntilNext * 60 * 60 * 1000);
  }

  /**
   * Save analysis results to database
   */
  private async saveAnalysisResults(
    userId: string,
    profileData: Partial<ErosUserProfile>
  ): Promise<void> {
    try {
      const { error } = await this.db.getClient()
        .from('eros_user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        });

      if (error) {
        throw new AnalysisError('Failed to save analysis results', {
          userId,
          dbError: error.message
        });
      }

      this.logger.debug('Analysis results saved', { userId });
    } catch (error) {
      this.logger.error('Failed to save analysis results', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Utility: Chunk array into batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const dbHealth = await this.db.healthCheck();
      const aiHealth = this.aiClient ? await this.aiClient.healthCheck() : { available: false };

      return {
        healthy: dbHealth.connected,
        details: {
          database: dbHealth,
          ai: aiHealth,
          config: {
            aiEnabled: this.config.enableAIAnalysis,
            batchSize: this.config.batchSize
          }
        }
      };
    } catch (error) {
      return {
        healthy: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}
