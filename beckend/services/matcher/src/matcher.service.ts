/**
 * EROS Matcher Service
 * Calculates compatibility scores and generates match recommendations
 *
 * @module services/matcher
 * @version 1.0.0
 */

import { Logger } from 'winston';
import {
  ErosMatchScore,
  ErosDailyMatch,
  MatchGenerationConfig,
  MatchScoringError,
  ScoreBreakdown
} from '../../shared/types/eros.types';
import { DatabaseClient } from '../../shared/database/client';
import { ScoringEngine } from './scoring-engine';
import { CompatibilityCalculator } from './compatibility-calculator';
import { RecommendationGenerator } from './recommendation-generator';
import { createLogger } from '../../shared/utils/logger';

export interface MatcherConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  matchConfig: MatchGenerationConfig;
  enableGeoFiltering: boolean;
  maxConcurrentCalculations: number;
}

export class MatcherService {
  private db: DatabaseClient;
  private scoringEngine: ScoringEngine;
  private compatibilityCalculator: CompatibilityCalculator;
  private recommendationGenerator: RecommendationGenerator;
  private logger: Logger;

  constructor(private config: MatcherConfig) {
    this.logger = createLogger('MatcherService');
    this.db = new DatabaseClient(config.supabaseUrl, config.supabaseServiceKey);
    this.scoringEngine = new ScoringEngine(config.matchConfig, this.logger);
    this.compatibilityCalculator = new CompatibilityCalculator(this.logger);
    this.recommendationGenerator = new RecommendationGenerator(this.db, this.logger);

    this.logger.info('MatcherService initialized', {
      minScore: config.matchConfig.min_compatibility_score,
      maxMatches: config.matchConfig.max_matches_per_user,
      geoEnabled: config.enableGeoFiltering
    });
  }

  /**
   * Calculate match scores for a user against all potential matches
   *
   * @param userId - UUID of user to calculate matches for
   * @returns Array of match scores
   */
  public async calculateMatchScores(userId: string): Promise<ErosMatchScore[]> {
    const startTime = Date.now();
    this.logger.info('Calculating match scores', { userId });

    try {
      // Step 1: Get user's EROS profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new MatchScoringError('User profile not found', { userId });
      }

      // Step 2: Get potential matches (exclude blocked, already matched, etc.)
      const potentialMatches = await this.getPotentialMatches(userId);

      this.logger.debug('Found potential matches', {
        userId,
        count: potentialMatches.length
      });

      if (potentialMatches.length === 0) {
        this.logger.warn('No potential matches found', { userId });
        return [];
      }

      // Step 3: Calculate scores in batches
      const matchScores = await this.calculateScoresInBatches(
        userId,
        userProfile,
        potentialMatches
      );

      // Step 4: Filter by minimum score and limit
      const filteredScores = matchScores
        .filter(score => score.compatibility_score >= this.config.matchConfig.min_compatibility_score)
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, this.config.matchConfig.max_matches_per_user);

      // Step 5: Save to database
      await this.saveMatchScores(filteredScores);

      const duration = Date.now() - startTime;
      this.logger.info('Match scores calculated', {
        userId,
        totalCalculated: matchScores.length,
        aboveThreshold: filteredScores.length,
        duration
      });

      return filteredScores;

    } catch (error) {
      this.logger.error('Match score calculation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof MatchScoringError) {
        throw error;
      }

      throw new MatchScoringError(
        `Failed to calculate match scores for user ${userId}`,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Generate daily match recommendations for a user
   *
   * @param userId - UUID of user
   * @param matchCount - Number of matches to generate (default: 2)
   * @returns Array of daily matches
   */
  public async generateDailyMatches(
    userId: string,
    matchCount: number = 2
  ): Promise<ErosDailyMatch[]> {
    this.logger.info('Generating daily matches', { userId, matchCount });

    try {
      // Step 1: Get valid match scores
      const matchScores = await this.getValidMatchScores(userId);

      if (matchScores.length === 0) {
        this.logger.warn('No valid match scores found', { userId });
        return [];
      }

      // Step 2: Generate personalized recommendations
      const recommendations = await this.recommendationGenerator.generateRecommendations(
        userId,
        matchScores,
        matchCount
      );

      // Step 3: Save daily matches
      const dailyMatches = await this.saveDailyMatches(userId, recommendations);

      this.logger.info('Daily matches generated', {
        userId,
        count: dailyMatches.length
      });

      return dailyMatches;

    } catch (error) {
      this.logger.error('Daily match generation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Batch generate daily matches for multiple users
   *
   * @param userIds - Array of user UUIDs
   * @param matchCount - Matches per user
   */
  public async generateDailyMatchesBatch(
    userIds: string[],
    matchCount: number = 2
  ): Promise<Map<string, ErosDailyMatch[]>> {
    this.logger.info('Generating daily matches batch', {
      userCount: userIds.length,
      matchCount
    });

    const results = new Map<string, ErosDailyMatch[]>();
    const errors: Array<{ userId: string; error: string }> = [];

    // Process in parallel with concurrency limit
    const batches = this.chunkArray(userIds, this.config.maxConcurrentCalculations);

    for (const batch of batches) {
      const promises = batch.map(async (userId) => {
        try {
          const matches = await this.generateDailyMatches(userId, matchCount);
          results.set(userId, matches);
        } catch (error) {
          errors.push({
            userId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });

      await Promise.all(promises);
    }

    this.logger.info('Daily matches batch completed', {
      successful: results.size,
      failed: errors.length
    });

    if (errors.length > 0) {
      this.logger.warn('Batch had errors', { errors });
    }

    return results;
  }

  /**
   * Recalculate scores for users whose data has changed
   */
  public async recalculateStaleScores(): Promise<number> {
    this.logger.info('Recalculating stale scores');

    try {
      // Find users whose profiles were updated after their last score calculation
      const { data: staleUsers, error } = await this.db.getClient()
        .from('eros_user_profiles')
        .select('user_id, last_analyzed_at')
        .not('last_analyzed_at', 'is', null)
        .order('last_analyzed_at', { ascending: true })
        .limit(100); // Process 100 at a time

      if (error) throw error;

      if (!staleUsers || staleUsers.length === 0) {
        this.logger.info('No stale scores found');
        return 0;
      }

      // Recalculate for each user
      let recalculated = 0;
      for (const user of staleUsers) {
        try {
          await this.calculateMatchScores(user.user_id);
          recalculated++;
        } catch (error) {
          this.logger.error('Failed to recalculate for user', {
            userId: user.user_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      this.logger.info('Stale scores recalculated', { count: recalculated });
      return recalculated;

    } catch (error) {
      this.logger.error('Failed to recalculate stale scores', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Calculate scores in batches to avoid overwhelming the system
   */
  private async calculateScoresInBatches(
    userId: string,
    userProfile: any,
    potentialMatches: any[]
  ): Promise<ErosMatchScore[]> {
    const batches = this.chunkArray(potentialMatches, this.config.maxConcurrentCalculations);
    const allScores: ErosMatchScore[] = [];

    for (const batch of batches) {
      const batchPromises = batch.map(async (targetProfile) => {
        try {
          return await this.calculateSingleMatchScore(userId, userProfile, targetProfile);
        } catch (error) {
          this.logger.warn('Failed to calculate score for match', {
            userId,
            targetUserId: targetProfile.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return null;
        }
      });

      const batchScores = await Promise.all(batchPromises);
      allScores.push(...batchScores.filter((s): s is ErosMatchScore => s !== null));
    }

    return allScores;
  }

  /**
   * Calculate compatibility score for a single match
   */
  private async calculateSingleMatchScore(
    userId: string,
    userProfile: any,
    targetProfile: any
  ): Promise<ErosMatchScore> {
    // Calculate individual component scores
    const breakdown = await this.compatibilityCalculator.calculate(
      userProfile,
      targetProfile,
      this.config.matchConfig.weights
    );

    // Calculate weighted total
    const totalScore = this.scoringEngine.calculateWeightedScore(
      breakdown,
      this.config.matchConfig.weights
    );

    // Generate reasoning
    const reasoning = this.scoringEngine.generateMatchReasoning(
      breakdown,
      userProfile,
      targetProfile
    );

    // Calculate confidence level
    const confidence = this.scoringEngine.calculateConfidence(
      userProfile,
      breakdown
    );

    // Calculate expiry time
    const expiresAt = new Date(
      Date.now() + this.config.matchConfig.score_expiry_hours * 60 * 60 * 1000
    );

    return {
      id: '', // Generated by database
      user_id: userId,
      target_user_id: targetProfile.id,
      compatibility_score: totalScore,
      confidence_level: confidence,
      score_breakdown: breakdown,
      match_reasoning: reasoning,
      ai_model_version: 'v1.0',
      computed_at: new Date(),
      expires_at: expiresAt,
      is_valid: true,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Get user's EROS profile
   */
  private async getUserProfile(userId: string) {
    const { data, error } = await this.db.getClient()
      .from('eros_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Get potential matches for a user
   */
  private async getPotentialMatches(userId: string): Promise<any[]> {
    const { data: user, error: userError } = await this.db.getClient()
      .from('users')
      .select('latitude, longitude, location_updated_at')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Build query for potential matches
    let query = this.db.getClient()
      .from('users')
      .select('*')
      .neq('id', userId)
      .eq('is_active', true)
      .eq('is_banned', false);

    // Apply geographic filtering if enabled and user has location
    if (this.config.enableGeoFiltering && user.latitude && user.longitude) {
      // Use PostGIS for radius search (requires PostGIS extension)
      // Simplified version - in production use proper geographic queries
      const radiusKm = this.config.matchConfig.geographic_radius_km;

      query = query
        .gte('latitude', user.latitude - (radiusKm / 111)) // Rough conversion
        .lte('latitude', user.latitude + (radiusKm / 111))
        .gte('longitude', user.longitude - (radiusKm / 111))
        .lte('longitude', user.longitude + (radiusKm / 111));
    }

    // Exclude blocked users
    const { data: blocks } = await this.db.getClient()
      .from('blocks')
      .select('blocked_user_id')
      .eq('user_id', userId);

    const blockedIds = blocks?.map(b => b.blocked_user_id) || [];

    if (blockedIds.length > 0) {
      query = query.not('id', 'in', `(${blockedIds.join(',')})`);
    }

    // Exclude users who blocked this user
    const { data: blockedBy } = await this.db.getClient()
      .from('blocks')
      .select('user_id')
      .eq('blocked_user_id', userId);

    const blockedByIds = blockedBy?.map(b => b.user_id) || [];

    if (blockedByIds.length > 0) {
      query = query.not('id', 'in', `(${blockedByIds.join(',')})`);
    }

    const { data, error } = await query.limit(1000); // Max 1000 potential matches

    if (error) throw error;
    return data || [];
  }

  /**
   * Get valid (non-expired) match scores for a user
   */
  private async getValidMatchScores(userId: string): Promise<ErosMatchScore[]> {
    const { data, error } = await this.db.getClient()
      .from('eros_match_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .gt('expires_at', new Date().toISOString())
      .order('compatibility_score', { ascending: false })
      .limit(50); // Top 50 for selection

    if (error) throw error;
    return data || [];
  }

  /**
   * Save match scores to database
   */
  private async saveMatchScores(scores: ErosMatchScore[]): Promise<void> {
    if (scores.length === 0) return;

    try {
      const { error } = await this.db.getClient()
        .from('eros_match_scores')
        .upsert(
          scores.map(score => ({
            user_id: score.user_id,
            target_user_id: score.target_user_id,
            compatibility_score: score.compatibility_score,
            confidence_level: score.confidence_level,
            score_breakdown: score.score_breakdown,
            match_reasoning: score.match_reasoning,
            ai_model_version: score.ai_model_version,
            computed_at: score.computed_at,
            expires_at: score.expires_at,
            is_valid: score.is_valid
          })),
          {
            onConflict: 'user_id,target_user_id',
            ignoreDuplicates: false
          }
        );

      if (error) {
        throw new MatchScoringError('Failed to save match scores', {
          dbError: error.message
        });
      }

      this.logger.debug('Match scores saved', { count: scores.length });
    } catch (error) {
      this.logger.error('Failed to save match scores', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Save daily matches to database
   */
  private async saveDailyMatches(
    userId: string,
    recommendations: Array<{
      matchScore: ErosMatchScore;
      rank: number;
      insight: string;
      category: string;
    }>
  ): Promise<ErosDailyMatch[]> {
    const today = new Date().toISOString().split('T')[0];

    const dailyMatches: Partial<ErosDailyMatch>[] = recommendations.map(rec => ({
      user_id: userId,
      match_user_id: rec.matchScore.target_user_id,
      rank: rec.rank,
      compatibility_score: rec.matchScore.compatibility_score,
      eros_insight: rec.insight,
      insight_category: rec.category,
      match_date: today,
      delivered_at: new Date()
    }));

    const { data, error } = await this.db.getClient()
      .from('eros_daily_matches')
      .insert(dailyMatches)
      .select();

    if (error) {
      throw new MatchScoringError('Failed to save daily matches', {
        userId,
        dbError: error.message
      });
    }

    return data || [];
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

      // Check if scoring engine is working
      const testBreakdown: ScoreBreakdown = {
        physical_attraction: 85,
        conversation_compatibility: 90,
        interest_alignment: 75,
        activity_pattern_match: 80,
        geographic_proximity: 95
      };

      const testScore = this.scoringEngine.calculateWeightedScore(
        testBreakdown,
        this.config.matchConfig.weights
      );

      return {
        healthy: dbHealth.connected && testScore > 0,
        details: {
          database: dbHealth,
          scoring_engine: {
            operational: testScore > 0,
            test_score: testScore
          },
          config: {
            min_score: this.config.matchConfig.min_compatibility_score,
            max_matches: this.config.matchConfig.max_matches_per_user,
            geo_enabled: this.config.enableGeoFiltering
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
