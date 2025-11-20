/**
 * Pattern Extractor
 * Extracts behavioral patterns and preferences from user data
 *
 * @module services/analyzer
 */

import { Logger } from 'winston';
import {
  PhysicalTypePreferences,
  RedFlag,
  ConversationStyle,
  EngagementPatterns
} from '../../shared/types/eros.types';

export class PatternExtractor {
  constructor(private logger: Logger) {}

  /**
   * Extract physical type preferences from favorited profiles
   */
  public async extractPhysicalPreferences(
    favorites: any[],
    profiles: any[]
  ): Promise<PhysicalTypePreferences> {
    if (profiles.length === 0) {
      return { confidence_score: 0 };
    }

    // Extract ages
    const ages = profiles
      .map(p => this.calculateAge(p.date_of_birth))
      .filter(age => age > 0);

    // Extract body types
    const bodyTypes = profiles
      .map(p => p.body_type)
      .filter(Boolean);

    // Extract ethnicities
    const ethnicities = profiles
      .map(p => p.ethnicity)
      .filter(Boolean);

    // Extract heights
    const heights = profiles
      .map(p => p.height_cm)
      .filter(h => h > 0);

    // Extract common attributes/tags
    const allAttributes: string[] = [];
    profiles.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        allAttributes.push(...p.tags);
      }
    });

    return {
      age_range: ages.length > 0 ? {
        min: Math.min(...ages),
        max: Math.max(...ages)
      } : undefined,
      body_types: this.getMostCommon(bodyTypes, 3),
      ethnicities: this.getMostCommon(ethnicities, 3),
      heights: heights.length > 0 ? {
        min: Math.min(...heights),
        max: Math.max(...heights)
      } : undefined,
      common_attributes: this.getMostCommon(allAttributes, 5),
      confidence_score: Math.min(100, profiles.length * 5) // More favorites = higher confidence
    };
  }

  /**
   * Extract red flags from blocked profiles
   */
  public async extractRedFlags(
    blocks: any[],
    profiles: any[]
  ): Promise<RedFlag[]> {
    if (profiles.length === 0) return [];

    const redFlags: Map<string, RedFlag> = new Map();

    profiles.forEach(profile => {
      // Check for common red flag attributes
      const attributes = [
        profile.body_type,
        profile.ethnicity,
        ...(profile.tags || [])
      ].filter(Boolean);

      attributes.forEach(attr => {
        const existing = redFlags.get(attr);
        if (existing) {
          existing.occurrences += 1;
          existing.last_seen = new Date();
        } else {
          redFlags.set(attr, {
            attribute: attr,
            severity: 'low', // Can be enhanced with ML
            occurrences: 1,
            last_seen: new Date()
          });
        }
      });
    });

    // Convert to array and sort by occurrences
    return Array.from(redFlags.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 10); // Top 10 red flags
  }

  /**
   * Analyze conversation style from messages
   */
  public async analyzeConversationStyle(messages: any[]): Promise<ConversationStyle> {
    if (messages.length === 0) {
      return {};
    }

    // Calculate average message length
    const messageLengths = messages.map(m => m.content?.length || 0);
    const avgLength = messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length;

    // Detect emoji usage
    const emojiPattern = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const messagesWithEmoji = messages.filter(m => emojiPattern.test(m.content || '')).length;
    const emojiUsageRatio = messagesWithEmoji / messages.length;

    let emojiUsage: 'none' | 'light' | 'moderate' | 'heavy';
    if (emojiUsageRatio === 0) emojiUsage = 'none';
    else if (emojiUsageRatio < 0.2) emojiUsage = 'light';
    else if (emojiUsageRatio < 0.5) emojiUsage = 'moderate';
    else emojiUsage = 'heavy';

    // Determine tone (basic heuristics - can be enhanced with NLP)
    const casualWords = ['lol', 'hey', 'yeah', 'cool', 'nice'];
    const formalWords = ['hello', 'thank you', 'please', 'regards'];
    const flirtyWords = ['sexy', 'hot', 'cute', '😘', '😍'];

    const messageContent = messages.map(m => m.content?.toLowerCase() || '').join(' ');
    const casualScore = casualWords.filter(w => messageContent.includes(w)).length;
    const formalScore = formalWords.filter(w => messageContent.includes(w)).length;
    const flirtyScore = flirtyWords.filter(w => messageContent.includes(w)).length;

    let tone: 'formal' | 'casual' | 'flirty' | 'direct';
    if (flirtyScore > casualScore && flirtyScore > formalScore) tone = 'flirty';
    else if (formalScore > casualScore) tone = 'formal';
    else if (avgLength < 30) tone = 'direct';
    else tone = 'casual';

    return {
      avg_message_length: Math.round(avgLength),
      response_speed: 'moderate', // Calculated in calculateResponseMetrics
      tone,
      emoji_usage: emojiUsage,
      conversation_depth: avgLength > 100 ? 'deep' : avgLength > 50 ? 'moderate' : 'shallow'
    };
  }

  /**
   * Calculate engagement patterns from activity log
   */
  public async calculateEngagementPatterns(activityLog: any[]): Promise<EngagementPatterns> {
    if (activityLog.length === 0) {
      return {};
    }

    // Extract activity hours
    const activityHours = activityLog.map(log =>
      new Date(log.timestamp || log.created_at).getHours()
    );

    // Count occurrences per hour
    const hourCounts = new Array(24).fill(0);
    activityHours.forEach(hour => hourCounts[hour]++);

    // Get peak hours (top 3)
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    // Calculate days active per week (mock - needs real tracking)
    const uniqueDays = new Set(
      activityLog.map(log =>
        new Date(log.timestamp || log.created_at).toDateString()
      )
    ).size;

    return {
      peak_activity_hours: peakHours,
      avg_session_duration_minutes: 30, // Mock - needs session tracking
      days_active_per_week: Math.min(7, uniqueDays),
      favorite_features: [] // Can be tracked from feature usage
    };
  }

  /**
   * Calculate response time metrics
   */
  public calculateResponseMetrics(threads: any[]): {
    avgResponseTime: number;
    avgLength: number;
  } {
    if (threads.length === 0) {
      return { avgResponseTime: 0, avgLength: 0 };
    }

    let totalResponseTime = 0;
    let responseCount = 0;
    let totalLength = 0;

    threads.forEach(thread => {
      const messages = thread.messages;
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i - 1].created_at).getTime();
        const currTime = new Date(messages[i].created_at).getTime();
        const diff = (currTime - prevTime) / (1000 * 60); // minutes

        if (diff < 1440) { // Only count if response within 24 hours
          totalResponseTime += diff;
          responseCount++;
        }
      }

      totalLength += messages.length;
    });

    return {
      avgResponseTime: responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0,
      avgLength: Math.round(totalLength / threads.length)
    };
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dob: string | null): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get most common items from array
   */
  private getMostCommon<T>(arr: T[], limit: number): T[] {
    const counts = new Map<T, number>();
    arr.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }
}
