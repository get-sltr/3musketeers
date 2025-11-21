// EROS Matcher Service
// Generates daily matches using learned preferences
// CLEAN • RELIABLE • SCALABLE • FUNCTIONAL • SUSTAINABLE

const { createClient } = require('@supabase/supabase-js');

class ErosMatcher {
  constructor(config = {}) {
    this.supabase = createClient(
      config.supabaseUrl || process.env.SUPABASE_URL,
      config.supabaseKey || process.env.SUPABASE_ANON_KEY
    );
    
    this.redis = config.redis || null;
  }

  /**
   * Generate daily matches for a user
   */
  async generateDailyMatches(userId, limit = 10) {
    console.log(`💘 Generating daily matches for ${userId.substring(0, 8)}...`);

    try {
      // Get user's ultimate preferences
      const { data: prefPattern } = await this.supabase
        .from('ultimate_preference_patterns')
        .select('pattern, confidence_score')
        .eq('user_id', userId)
        .order('learned_at', { ascending: false })
        .limit(1)
        .single();

      // Get user's profile for context
      const { data: userProfile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get candidate profiles
      const candidates = await this.getCandidates(userId, userProfile, limit * 3);

      if (candidates.length === 0) {
        console.log(`ℹ️  No candidates found for ${userId.substring(0, 8)}...`);
        return { success: true, matches: [] };
      }

      // Score each candidate
      const scoredCandidates = await Promise.all(
        candidates.map(candidate => 
          this.scoreCandidate(userId, candidate, prefPattern?.pattern, userProfile)
        )
      );

      // Sort by score and take top N
      const topMatches = scoredCandidates
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Store matches
      const matchRecords = topMatches.map((match, index) => ({
        user_id: userId,
        matched_user_id: match.candidate.id,
        match_type: 'daily',
        compatibility_score: match.score,
        reason: match.reason,
        rank: index + 1,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      }));

      // Delete old daily matches
      await this.supabase
        .from('matches')
        .delete()
        .eq('user_id', userId)
        .eq('match_type', 'daily');

      // Insert new matches
      const { error: insertError } = await this.supabase
        .from('matches')
        .insert(matchRecords);

      if (insertError) {
        throw insertError;
      }

      // Cache in Redis
      if (this.redis) {
        await this.redis.setEx(
          `eros:daily_matches:${userId}`,
          86400, // 24 hours
          JSON.stringify(topMatches)
        );
      }

      console.log(`✅ Generated ${topMatches.length} matches for ${userId.substring(0, 8)}...`);

      return { 
        success: true, 
        matches: topMatches,
        confidence: prefPattern?.confidence_score || 0,
      };
    } catch (error) {
      console.error('Match generation error:', error);
      throw error;
    }
  }

  /**
   * Get candidate profiles for matching
   */
  async getCandidates(userId, userProfile, limit = 30) {
    // Build query based on user preferences
    let query = this.supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .eq('looking_for', userProfile.position || 'versatile')
      .is('deleted_at', null);

    // Filter by age range (if specified)
    if (userProfile.min_age && userProfile.max_age) {
      query = query
        .gte('age', userProfile.min_age)
        .lte('age', userProfile.max_age);
    }

    // Get candidates
    const { data: candidates, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }

    return candidates || [];
  }

  /**
   * Score a candidate against user preferences
   */
  async scoreCandidate(userId, candidate, prefPattern, userProfile) {
    let score = 0;
    const reasons = [];

    // Base score: profile completeness (0-20 points)
    const completeness = this.calculateCompleteness(candidate);
    score += completeness * 20;
    if (completeness > 0.8) {
      reasons.push('Complete profile');
    }

    // Preference matching (0-30 points)
    if (prefPattern?.actualTypePreferences) {
      const prefMatch = this.matchPreferences(candidate, prefPattern.actualTypePreferences);
      score += prefMatch * 30;
      if (prefMatch > 0.7) {
        reasons.push('Matches your type');
      }
    }

    // Mutual interest (0-20 points)
    const mutualScore = await this.checkMutualInterest(userId, candidate.id);
    score += mutualScore * 20;
    if (mutualScore > 0) {
      reasons.push('Mutual interest detected');
    }

    // Online status bonus (0-10 points)
    if (candidate.online) {
      score += 10;
      reasons.push('Online now');
    }

    // Proximity bonus (0-10 points) - if location data available
    if (userProfile.location && candidate.location) {
      const proximityScore = this.calculateProximity(userProfile.location, candidate.location);
      score += proximityScore * 10;
      if (proximityScore > 0.7) {
        reasons.push('Nearby');
      }
    }

    // Activity bonus (0-10 points)
    const activityScore = this.calculateActivity(candidate);
    score += activityScore * 10;

    return {
      candidate,
      score: Math.round(score),
      reason: reasons.join(', ') || 'Good match',
    };
  }

  /**
   * Calculate profile completeness
   */
  calculateCompleteness(profile) {
    const fields = [
      'display_name',
      'about',
      'age',
      'position',
      'body_type',
      'ethnicity',
      'photos',
      'tags',
    ];

    let filled = 0;
    for (const field of fields) {
      const value = profile[field];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) filled++;
        else if (!Array.isArray(value)) filled++;
      }
    }

    return filled / fields.length;
  }

  /**
   * Match candidate against preferences
   */
  matchPreferences(candidate, preferences) {
    let matches = 0;
    let total = 0;

    // Age range
    if (preferences.age_range && candidate.age) {
      total++;
      const [minAge, maxAge] = preferences.age_range;
      if (candidate.age >= minAge && candidate.age <= maxAge) {
        matches++;
      }
    }

    // Body types
    if (preferences.body_types && candidate.body_type) {
      total++;
      if (preferences.body_types.includes(candidate.body_type)) {
        matches++;
      }
    }

    // Positions
    if (preferences.positions && candidate.position) {
      total++;
      if (preferences.positions.includes(candidate.position)) {
        matches++;
      }
    }

    return total > 0 ? matches / total : 0.5; // Default 0.5 if no prefs
  }

  /**
   * Check if there's mutual interest
   */
  async checkMutualInterest(userId, candidateId) {
    // Check if candidate favorited/liked user
    const { data: mutualLike } = await this.supabase
      .from('favorites')
      .select('id')
      .eq('user_id', candidateId)
      .eq('favorite_user_id', userId)
      .limit(1);

    return mutualLike && mutualLike.length > 0 ? 1 : 0;
  }

  /**
   * Calculate proximity score (0-1)
   */
  calculateProximity(location1, location2) {
    // Simplified: real implementation would use geohash or PostGIS
    if (!location1 || !location2) return 0;
    
    // Placeholder: return random for now
    return 0.5;
  }

  /**
   * Calculate activity score (0-1)
   */
  calculateActivity(profile) {
    if (!profile.last_active) return 0;

    const lastActive = new Date(profile.last_active).getTime();
    const now = Date.now();
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);

    // Active in last hour = 1.0, scales down over 7 days
    if (hoursSinceActive < 1) return 1.0;
    if (hoursSinceActive < 24) return 0.8;
    if (hoursSinceActive < 72) return 0.5;
    if (hoursSinceActive < 168) return 0.3;
    return 0.1;
  }

  /**
   * Get cached daily matches
   */
  async getCachedMatches(userId) {
    if (!this.redis) {
      // Fall back to database
      return this.getMatchesFromDB(userId);
    }

    const cached = await this.redis.get(`eros:daily_matches:${userId}`);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return this.getMatchesFromDB(userId);
  }

  /**
   * Get matches from database
   */
  async getMatchesFromDB(userId) {
    const { data: matches } = await this.supabase
      .from('matches')
      .select(`
        *,
        matched_profile:profiles!matched_user_id(*)
      `)
      .eq('user_id', userId)
      .eq('match_type', 'daily')
      .order('rank', { ascending: true })
      .limit(10);

    return matches || [];
  }
}

// Singleton instance
let matcherInstance = null;

function getMatcher(config) {
  if (!matcherInstance) {
    matcherInstance = new ErosMatcher(config);
  }
  return matcherInstance;
}

// Export functions
module.exports = {
  ErosMatcher,
  getMatcher,
  generateDailyMatches: async (userId, limit) => getMatcher().generateDailyMatches(userId, limit),
  getCachedMatches: async (userId) => getMatcher().getCachedMatches(userId),
};
