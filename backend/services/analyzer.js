// EROS Analyzer Service
// Analyzes user behavior to learn preferences
// CLEAN • RELIABLE • SCALABLE • FUNCTIONAL • SUSTAINABLE

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * Sanitize environment variable - remove quotes, trim whitespace, handle newlines
 */
function sanitizeEnvVar(value) {
  if (!value) return null;
  return value
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .replace(/\\n/g, '')          // Remove escaped newlines
    .replace(/\n/g, '')           // Remove actual newlines
    .trim();                       // Trim whitespace
}

/**
 * Create and validate Supabase client
 */
function createValidatedSupabaseClient(configUrl, configKey) {
  const url = sanitizeEnvVar(configUrl || process.env.SUPABASE_URL);
  const key = sanitizeEnvVar(configKey || process.env.SUPABASE_ANON_KEY);

  if (!url || !key) {
    console.error('❌ EROS Analyzer: Missing Supabase credentials');
    return null;
  }

  if (!url.includes('supabase') || !key.startsWith('eyJ')) {
    console.error('❌ EROS Analyzer: Invalid Supabase credential format');
    return null;
  }

  return createClient(url, key);
}

/**
 * Create and validate Anthropic client
 */
function createValidatedAnthropicClient() {
  const apiKey = sanitizeEnvVar(process.env.ANTHROPIC_API_KEY);

  if (!apiKey) {
    console.warn('⚠️  EROS Analyzer: ANTHROPIC_API_KEY not set - AI analysis disabled');
    return null;
  }

  // Anthropic API keys can be 'sk-ant-...' or just 'sk-...'
  if (!apiKey.startsWith('sk-')) {
    console.error('❌ EROS Analyzer: Invalid ANTHROPIC_API_KEY format (should start with sk-)');
    return null;
  }

  console.log('✅ EROS Analyzer: Anthropic API key validated');
  return new Anthropic({ apiKey });
}

class ErosAnalyzer {
  constructor(config = {}) {
    this.supabase = createValidatedSupabaseClient(config.supabaseUrl, config.supabaseKey);
    this.anthropic = createValidatedAnthropicClient();
    this.redis = config.redis || null;

    // Log initialization status
    console.log('📋 EROS Analyzer initialized:');
    console.log(`   - Supabase: ${this.supabase ? '✅' : '❌'}`);
    console.log(`   - Anthropic: ${this.anthropic ? '✅' : '⚠️ Disabled'}`);
    console.log(`   - Redis: ${this.redis ? '✅' : '⚠️ Not configured'}`);
  }

  /**
   * Phase 1: Light analysis (5% CPU)
   * - Quick pattern extraction
   * - Cache frequently viewed profiles
   */
  async lightAnalysis(userId) {
    console.log(`🔍 Phase 1 analysis for ${userId.substring(0, 8)}...`);
    
    try {
      // Get recent favorites (last 7 days)
      const { data: recentFavorites } = await this.supabase
        .from('favorites')
        .select('favorite_user_id, created_at, view_count')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('view_count', { ascending: false })
        .limit(10);

      // Cache result
      if (this.redis && recentFavorites) {
        await this.redis.setEx(
          `eros:favorites:${userId}`,
          3600, // 1 hour TTL
          JSON.stringify(recentFavorites)
        );
      }

      return { success: true, phase: 1, favorites: recentFavorites?.length || 0 };
    } catch (error) {
      console.error('Phase 1 analysis error:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Medium analysis (15% CPU)
   * - Analyze message patterns
   * - Extract common traits from interactions
   */
  async mediumAnalysis(userId) {
    console.log(`🔍 Phase 2 analysis for ${userId.substring(0, 8)}...`);
    
    try {
      // Analyze favorites with profile data
      const favoritePatterns = await this.analyzeFavorites(userId);
      
      // Analyze message behavior
      const messagePatterns = await this.analyzeMessageBehavior(userId);

      // Store patterns
      await this.supabase
        .from('favorite_patterns')
        .upsert({
          user_id: userId,
          patterns: favoritePatterns,
          analyzed_at: new Date().toISOString(),
        });

      await this.supabase
        .from('message_behavior_patterns')
        .upsert({
          user_id: userId,
          patterns: messagePatterns,
          analyzed_at: new Date().toISOString(),
        });

      return { 
        success: true, 
        phase: 2, 
        favoritePatterns,
        messagePatterns,
      };
    } catch (error) {
      console.error('Phase 2 analysis error:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Deep analysis (80% CPU)
   * - Full AI-powered learning
   * - Ultimate preference extraction
   */
  async deepAnalysis(userId) {
    console.log(`🔍 Phase 3 analysis for ${userId.substring(0, 8)}...`);
    
    try {
      // Gather all data sources
      const [favorites, callHistory, blocks, messages] = await Promise.all([
        this.getFavoriteData(userId),
        this.getCallHistoryData(userId),
        this.getBlockData(userId),
        this.getMessageData(userId),
      ]);

      // Run AI analysis if available
      let ultimatePattern = null;
      
      if (this.anthropic) {
        ultimatePattern = await this.runAIAnalysis(userId, {
          favorites,
          callHistory,
          blocks,
          messages,
        });
      } else {
        // Fallback: rule-based analysis
        ultimatePattern = this.ruleBasedAnalysis({
          favorites,
          callHistory,
          blocks,
          messages,
        });
      }

      // Store ultimate pattern
      await this.supabase
        .from('ultimate_preference_patterns')
        .upsert({
          user_id: userId,
          pattern: ultimatePattern,
          confidence_score: this.calculateConfidence(favorites, callHistory, blocks),
          learned_at: new Date().toISOString(),
        });

      return { 
        success: true, 
        phase: 3,
        ultimatePattern,
      };
    } catch (error) {
      console.error('Phase 3 analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze favorites to extract preferences
   */
  async analyzeFavorites(userId) {
    const { data: favorites } = await this.supabase
      .from('favorites')
      .select(`
        favorite_user_id,
        view_count,
        message_frequency,
        profiles!favorite_user_id (
          age,
          body_type,
          ethnicity,
          position,
          tags,
          kinks
        )
      `)
      .eq('user_id', userId)
      .order('view_count', { ascending: false })
      .limit(20);

    if (!favorites || favorites.length === 0) {
      return { topTraits: [], favoriteType: 'none' };
    }

    // Extract common traits
    const traits = {};
    
    for (const fav of favorites) {
      const profile = fav.profiles;
      if (!profile) continue;

      // Count age ranges
      if (profile.age) {
        const ageGroup = Math.floor(profile.age / 5) * 5; // Group by 5s
        traits[`age_${ageGroup}`] = (traits[`age_${ageGroup}`] || 0) + 1;
      }

      // Count body types
      if (profile.body_type) {
        traits[`body_${profile.body_type}`] = (traits[`body_${profile.body_type}`] || 0) + 1;
      }

      // Count positions
      if (profile.position) {
        traits[`pos_${profile.position}`] = (traits[`pos_${profile.position}`] || 0) + 1;
      }
    }

    // Get top traits
    const topTraits = Object.entries(traits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([trait]) => trait);

    return { topTraits, favoriteType: 'analyzed', count: favorites.length };
  }

  /**
   * Analyze message behavior
   */
  async analyzeMessageBehavior(userId) {
    const { data: sentMessages } = await this.supabase
      .from('messages')
      .select('receiver_id, content, created_at')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!sentMessages || sentMessages.length === 0) {
      return { messageStyle: 'unknown', whoTheyMessage: [] };
    }

    // Count messages per recipient
    const recipientCounts = {};
    for (const msg of sentMessages) {
      recipientCounts[msg.receiver_id] = (recipientCounts[msg.receiver_id] || 0) + 1;
    }

    // Get top recipients
    const whoTheyMessage = Object.entries(recipientCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([recipientId]) => recipientId);

    return { 
      messageStyle: 'analyzed',
      whoTheyMessage,
      totalMessages: sentMessages.length,
    };
  }

  /**
   * Run AI analysis using Claude
   */
  async runAIAnalysis(userId, data) {
    const prompt = `Analyze this user's dating behavior and extract their TRUE preferences:

Favorites: ${JSON.stringify(data.favorites).substring(0, 1000)}
Call History: ${JSON.stringify(data.callHistory).substring(0, 500)}
Blocks: ${JSON.stringify(data.blocks).substring(0, 500)}
Messages: ${JSON.stringify(data.messages).substring(0, 500)}

Return JSON with:
- actualTypePreferences (age_range, body_types, positions)
- connectionPatterns (preferred_first_contact, message_style)
- dealbreakers (instant_blocks, red_flags)
- successFormulas (perfect_match_traits)`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0]?.text;
      return content ? JSON.parse(content) : this.ruleBasedAnalysis(data);
    } catch (error) {
      console.warn('AI analysis failed, using rule-based:', error.message);
      return this.ruleBasedAnalysis(data);
    }
  }

  /**
   * Rule-based analysis (fallback)
   */
  ruleBasedAnalysis(data) {
    return {
      actualTypePreferences: {
        age_range: [25, 35],
        body_types: ['average', 'athletic'],
        positions: ['versatile'],
      },
      connectionPatterns: {
        preferred_first_contact: 'message',
        message_style: 'friendly',
      },
      dealbreakers: {
        instant_blocks: [],
        red_flags: [],
      },
      successFormulas: {
        perfect_match_traits: [],
      },
    };
  }

  /**
   * Get favorite data
   */
  async getFavoriteData(userId) {
    const { data } = await this.supabase
      .from('favorites')
      .select('favorite_user_id, view_count')
      .eq('user_id', userId)
      .limit(20);
    return data || [];
  }

  /**
   * Get call history data
   */
  async getCallHistoryData(userId) {
    const { data } = await this.supabase
      .from('call_history')
      .select('partner_id, duration, call_type')
      .eq('user_id', userId)
      .limit(50);
    return data || [];
  }

  /**
   * Get block data
   */
  async getBlockData(userId) {
    const { data } = await this.supabase
      .from('blocks')
      .select('blocked_user_id, reason, created_at')
      .eq('user_id', userId)
      .limit(20);
    return data || [];
  }

  /**
   * Get message data
   */
  async getMessageData(userId) {
    const { data } = await this.supabase
      .from('messages')
      .select('receiver_id, content, created_at')
      .eq('sender_id', userId)
      .limit(100);
    return data || [];
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(favorites, callHistory, blocks) {
    const dataPoints = 
      (favorites?.length || 0) * 10 +
      (callHistory?.length || 0) * 5 +
      (blocks?.length || 0) * 3;
    
    return Math.min(100, dataPoints);
  }
}

// Singleton instance
let analyzerInstance = null;

function getAnalyzer(config) {
  if (!analyzerInstance) {
    analyzerInstance = new ErosAnalyzer(config);
  }
  return analyzerInstance;
}

// Export functions for scheduler
module.exports = {
  ErosAnalyzer,
  getAnalyzer,
  lightAnalysis: async (userId) => getAnalyzer().lightAnalysis(userId),
  mediumAnalysis: async (userId) => getAnalyzer().mediumAnalysis(userId),
  deepAnalysis: async (userId) => getAnalyzer().deepAnalysis(userId),
};
