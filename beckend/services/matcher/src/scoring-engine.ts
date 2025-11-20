/**
 * Scoring Engine
 * Calculates weighted compatibility scores
 *
 * @module services/matcher
 */

import { Logger } from 'winston';
import { ScoreBreakdown } from '../../shared/types/eros.types';

export class ScoringEngine {
  constructor(
    private config: any,
    private logger: Logger
  ) {}

  /**
   * Calculate weighted total score from breakdown
   */
  public calculateWeightedScore(
    breakdown: ScoreBreakdown,
    weights: ScoreBreakdown
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, score] of Object.entries(breakdown)) {
      const weight = weights[key] || 1;
      totalScore += score * weight;
      totalWeight += weight;
    }

    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    return Math.round(normalizedScore * 100) / 100; // Round to 2 decimals
  }

  /**
   * Generate human-readable match reasoning
   */
  public generateMatchReasoning(
    breakdown: ScoreBreakdown,
    userProfile: any,
    targetProfile: any
  ): string {
    // Find highest scoring component
    const sortedScores = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a);

    const topComponent = sortedScores[0];
    const secondComponent = sortedScores[1];

    const reasons: string[] = [];

    // Physical attraction reasoning
    if (topComponent[0] === 'physical_attraction' || secondComponent[0] === 'physical_attraction') {
      reasons.push('Matches your physical type preferences');
    }

    // Conversation compatibility
    if (topComponent[0] === 'conversation_compatibility' || secondComponent[0] === 'conversation_compatibility') {
      const userStyle = userProfile.eros_user_profile?.conversation_style?.tone || 'casual';
      reasons.push(`Similar ${userStyle} conversation style`);
    }

    // Interest alignment
    if (breakdown.interest_alignment > 75) {
      reasons.push('Shared interests and lifestyle');
    }

    // Activity patterns
    if (breakdown.activity_pattern_match > 80) {
      reasons.push('Active at similar times');
    }

    // Geographic proximity
    if (breakdown.geographic_proximity > 90) {
      reasons.push('Very close to your location');
    } else if (breakdown.geographic_proximity > 70) {
      reasons.push('In your area');
    }

    // Construct final reasoning
    if (reasons.length === 0) {
      return 'Compatible based on overall profile analysis';
    }

    if (reasons.length === 1) {
      return reasons[0];
    }

    if (reasons.length === 2) {
      return `${reasons[0]} and ${reasons[1].toLowerCase()}`;
    }

    return `${reasons[0]}, ${reasons[1].toLowerCase()}, and ${reasons[2].toLowerCase()}`;
  }

  /**
   * Calculate confidence level based on data completeness
   */
  public calculateConfidence(
    userProfile: any,
    breakdown: ScoreBreakdown
  ): number {
    let confidence = 100;

    // Reduce confidence if user has limited data
    const favoriteCount = userProfile.favorite_count || 0;
    const messageCount = userProfile.message_thread_count || 0;

    if (favoriteCount < 5) confidence -= 20;
    if (favoriteCount < 10) confidence -= 10;
    if (messageCount < 3) confidence -= 15;
    if (messageCount < 10) confidence -= 10;

    // Reduce confidence if analysis is old
    const lastAnalyzed = userProfile.last_analyzed_at
      ? new Date(userProfile.last_analyzed_at).getTime()
      : 0;
    const hoursSinceAnalysis = (Date.now() - lastAnalyzed) / (1000 * 60 * 60);

    if (hoursSinceAnalysis > 168) confidence -= 20; // Over a week old
    else if (hoursSinceAnalysis > 72) confidence -= 10; // Over 3 days

    // Boost confidence if all score components are high
    const avgScore = Object.values(breakdown).reduce((a, b) => a + b, 0) / Object.keys(breakdown).length;
    if (avgScore > 85) confidence += 10;

    return Math.max(0, Math.min(100, confidence));
  }
}
