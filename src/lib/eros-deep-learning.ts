// src/lib/eros-deep-learning.ts
// EROS DEEP LEARNING - Analyzes EVERYTHING to learn TRUE preferences

import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

/**
 * GROQ vs OTHERS - Pricing & Limits Comparison:
 * 
 * Groq:    FREE - 14,400 requests/day - FAST ⚡
 * OpenAI:  $0.002/1k tokens - Slower 🐢
 * Claude:  $0.015/1k tokens - Expensive 💰
 * Gemini:  Limited free tier - Restricted 🚫
 * 
 * GROQ is the clear winner: FREE + FAST + HIGH LIMITS
 */

// Lazy initialization to avoid build-time errors
function getErosClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is required');
  }
  return new Groq({ apiKey });
}

// Helper function to handle rate limits with retry
async function makeErosRequest(
  requestFn: () => Promise<any>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Rate limited - wait and retry
      if (error?.status === 429 || error?.statusCode === 429) {
        const delay = retryDelay * (attempt + 1); // Exponential backoff
        console.warn(`⚠️ EROS rate limited (429), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Other errors - throw immediately
      throw error;
    }
  }
  
  // All retries failed
  throw lastError || new Error('EROS request failed after retries');
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ============================================
// 🧠 DEEP BEHAVIOR ANALYSIS
// ============================================

interface DeepBehaviorData {
  userId: string;
  
  // FAVORITES - Who they keep coming back to
  favorites: {
    profileId: string;
    addedAt: Date;
    viewCount: number; // How often they view this profile
    lastViewed: Date;
    messageFrequency: number; // Messages per day
    profile?: any; // Full profile data
  }[];
  
  // CALL HISTORY - Who they actually video/voice with
  callHistory: {
    partnerId: string;
    callType: 'video' | 'voice';
    duration: number; // seconds
    initiatedBy: 'user' | 'partner';
    timeOfDay: string;
    dayOfWeek: string;
    quality: 'completed' | 'missed' | 'rejected' | 'short'; // short = under 1 min
    followedByHookup: boolean;
    profile?: any;
  }[];
  
  // BLOCKS - Red flags and dealbreakers
  blockHistory: {
    blockedId: string;
    blockedAt: Date;
    afterMessages: number;
    afterCallAttempt: boolean;
    reason?: string; // If provided
    triggerMessage?: string; // Last message before block
    profile?: any;
  }[];
  
  // TAP HISTORY - Quick interest signals
  tapHistory: {
    tappedUserId: string;
    tappedAt: Date;
    reciprocated: boolean;
    ledToConversation: boolean;
    ledToMeeting: boolean;
    profile?: any;
  }[];
  
  // VIEW PATTERNS - Who they actually look at
  viewPatterns: {
    viewedProfileId: string;
    viewCount: number;
    totalViewTime: number; // seconds
    viewedPhotos: boolean;
    viewedFullProfile: boolean;
    scrollDepth: number; // How far they scrolled
    profile?: any;
  }[];
  
  // PHOTO INTERACTIONS
  photoInteractions: {
    userId: string;
    photosSent: number;
    photosRequested: boolean;
    nsfwSent: boolean;
    responseToPhotos: 'positive' | 'negative' | 'ignored';
  }[];
}

interface UltimatePrefPattern {
  // WHO they really want
  actualTypePreferences: {
    age_range: [number, number];
    body_types: string[];
    ethnicities: string[];
    positions: string[];
    relationship_styles: string[];
    personality_traits: string[];
  };
  
  // HOW they really connect
  connectionPatterns: {
    preferred_first_contact: 'message' | 'tap' | 'photo';
    message_style: 'direct' | 'friendly' | 'flirty' | 'aggressive';
    escalation_speed: 'immediate' | 'same_day' | 'few_days' | 'slow';
    video_call_threshold: number; // Messages before video
    meeting_threshold: number; // Days before meeting
  };
  
  // WHEN they're active
  temporalPatterns: {
    most_active_hours: number[];
    most_active_days: string[];
    hookup_days: string[];
    chat_only_times: string[];
  };
  
  // WHAT kills it
  dealbreakers: {
    instant_blocks: string[]; // Traits that cause instant blocks
    conversation_killers: string[]; // What ends conversations
    ghost_triggers: string[]; // What makes them ghost
    red_flags: string[]; // Warning signs they avoid
  };
  
  // SUCCESS formulas
  successFormulas: {
    perfect_match_traits: string[];
    ideal_conversation_flow: string[];
    optimal_escalation_path: string[];
    meeting_success_factors: string[];
  };
}

// ============================================
// 1. 💝 LEARN FROM FAVORITES
// ============================================

export async function analyzeFavorites(
  userId: string
): Promise<{
  patterns: any;
  topTraits: string[];
  favoriteType: string;
}> {
  try {
    // Get all favorites with full profiles
    const supabase = getSupabaseClient();
    const { data: favorites } = await supabase
      .from('favorites')
      .select(`
        *,
        favorite_profile:profiles!favorite_user_id(*)
      `)
      .eq('user_id', userId)
      .order('view_count', { ascending: false });
    
    if (!favorites || favorites.length === 0) {
      return { patterns: {}, topTraits: [], favoriteType: 'none' };
    }
    
    const prompt = `
    You are EROS analyzing what someone REALLY likes based on their FAVORITES.
    
    User has ${favorites.length} favorites they keep coming back to:
    ${favorites.map(f => ({
      profile: f.favorite_profile,
      viewCount: f.view_count,
      messageFrequency: f.message_frequency,
      lastViewed: f.last_viewed
    }))}
    
    Analyze:
    1. What physical traits do ALL favorites share?
    2. What personality patterns emerge?
    3. What's the "type" they're obsessed with?
    4. Why do they keep coming back to these specific profiles?
    5. What makes these different from random matches?
    
    Be SPECIFIC - if all favorites are "muscular latinos 25-30" say that!
    
    Return detailed analysis as JSON
    `;

    const eros = getErosClient();
    const response = await makeErosRequest(() => 
      eros.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from EROS API');
    }
    const analysis = JSON.parse(content);
    
    // Store favorite patterns
    await supabase
      .from('favorite_patterns')
      .upsert({
        user_id: userId,
        patterns: analysis.patterns,
        top_traits: analysis.topTraits,
        favorite_type: analysis.favoriteType,
        analyzed_at: new Date().toISOString()
      });
    
    return analysis;
  } catch (error) {
    console.error('Eros Favorites Error:', error);
    throw error;
  }
}

// ============================================
// 2. 📞 LEARN FROM CALL HISTORY
// ============================================

export async function analyzeCallHistory(
  userId: string
): Promise<{
  videoCallPatterns: any;
  whoTheyActuallyCall: string[];
  callToHookupRate: number;
  preferredCallTime: string;
}> {
  try {
    // Get call history with partner profiles
    const supabase = getSupabaseClient();
    const { data: calls } = await supabase
      .from('call_history')
      .select(`
        *,
        partner:profiles!partner_id(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (!calls || calls.length === 0) {
      return {
        videoCallPatterns: {},
        whoTheyActuallyCall: [],
        callToHookupRate: 0,
        preferredCallTime: 'none'
      };
    }
    
    // Get successful calls (over 3 minutes)
    const successfulCalls = calls.filter(c => c.duration > 180);
    const shortCalls = calls.filter(c => c.duration < 60);
    
    const prompt = `
    You are EROS analyzing who someone ACTUALLY video calls with.
    
    Total calls: ${calls.length}
    Successful calls (>3min): ${successfulCalls.length}
    Quick hangups (<1min): ${shortCalls.length}
    
    Successful call partners:
    ${successfulCalls.map(c => ({
      partner: c.partner,
      duration: c.duration,
      timeOfDay: c.time_of_day,
      followedByHookup: c.followed_by_hookup
    }))}
    
    Failed/Short calls:
    ${shortCalls.map(c => ({
      partner: c.partner,
      duration: c.duration
    }))}
    
    Analyze:
    1. What type of guys do they ACTUALLY video call with?
    2. What's different about short vs long calls?
    3. What patterns lead to hookups after calls?
    4. When do they prefer video calls?
    5. Who do they reject on video?
    
    Return detailed patterns as JSON
    `;

    const eros = getErosClient();
    const response = await makeErosRequest(() => 
      eros.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from EROS API');
    }
    const analysis = JSON.parse(content);
    
    // Calculate call-to-hookup rate
    const callsWithHookup = calls.filter(c => c.followed_by_hookup).length;
    analysis.callToHookupRate = (callsWithHookup / calls.length * 100).toFixed(1);
    
    return analysis;
  } catch (error) {
    console.error('Eros Call History Error:', error);
    throw error;
  }
}

// ============================================
// 3. 🚫 LEARN FROM BLOCKS
// ============================================

export async function analyzeBlockPatterns(
  userId: string
): Promise<{
  instantBlockTriggers: string[];
  dealbreakers: string[];
  blockPatterns: any;
  toxicTraits: string[];
}> {
  try {
    // Get block history with blocked profiles
    const supabase = getSupabaseClient();
    const { data: blocks } = await supabase
      .from('block_history')
      .select(`
        *,
        blocked_profile:profiles!blocked_user_id(*)
      `)
      .eq('user_id', userId)
      .order('blocked_at', { ascending: false });
    
    if (!blocks || blocks.length === 0) {
      return {
        instantBlockTriggers: [],
        dealbreakers: [],
        blockPatterns: {},
        toxicTraits: []
      };
    }
    
    // Categorize blocks
    const instantBlocks = blocks.filter(b => b.after_messages <= 3);
    const afterCallBlocks = blocks.filter(b => b.after_call_attempt);
    
    const prompt = `
    You are EROS analyzing what makes someone block others.
    
    Total blocks: ${blocks.length}
    Instant blocks (≤3 messages): ${instantBlocks.length}
    Blocks after calls: ${afterCallBlocks.length}
    
    Instant block profiles:
    ${instantBlocks.map(b => ({
      profile: b.blocked_profile,
      triggerMessage: b.trigger_message,
      afterMessages: b.after_messages
    }))}
    
    All blocked profiles:
    ${blocks.map(b => ({
      profile: b.blocked_profile,
      reason: b.reason,
      afterMessages: b.after_messages
    }))}
    
    Identify:
    1. What triggers INSTANT blocks?
    2. What traits do ALL blocked profiles share?
    3. What are absolute dealbreakers?
    4. What toxic behaviors to auto-filter?
    5. What messages cause blocks?
    
    Be SPECIFIC about patterns - age, behavior, message style, etc.
    
    Return as JSON with clear patterns
    `;

    const eros = getErosClient();
    const response = await makeErosRequest(() => 
      eros.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      })
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from EROS API');
    }
    const analysis = JSON.parse(content);
    
    // Store block patterns for filtering
    await supabase
      .from('block_patterns')
      .upsert({
        user_id: userId,
        instant_triggers: analysis.instantBlockTriggers,
        dealbreakers: analysis.dealbreakers,
        toxic_traits: analysis.toxicTraits,
        updated_at: new Date().toISOString()
      });
    
    return analysis;
  } catch (error) {
    console.error('Eros Block Analysis Error:', error);
    throw error;
  }
}

// ============================================
// 4. 🎯 ULTIMATE PREFERENCE LEARNER
// ============================================

export async function learnUltimatePreferences(
  userId: string
): Promise<UltimatePrefPattern> {
  try {
    // Gather ALL data sources
    const [favorites, callHistory, blockPatterns, conversationData, tapData, viewData] = await Promise.all([
      analyzeFavorites(userId),
      analyzeCallHistory(userId),
      analyzeBlockPatterns(userId),
      getConversationHistory(userId),
      getTapHistory(userId),
      getViewPatterns(userId)
    ]);
    
    const prompt = `
    You are EROS, the ultimate AI learning what someone REALLY wants, not what they say.
    
    FAVORITES ANALYSIS:
    ${JSON.stringify(favorites)}
    
    VIDEO CALL PATTERNS:
    ${JSON.stringify(callHistory)}
    
    BLOCK/DEALBREAKER PATTERNS:
    ${JSON.stringify(blockPatterns)}
    
    CONVERSATION OUTCOMES:
    ${JSON.stringify(conversationData)}
    
    TAP INTERACTIONS:
    ${JSON.stringify(tapData)}
    
    VIEWING PATTERNS:
    ${JSON.stringify(viewData)}
    
    Create the ULTIMATE preference profile:
    1. Who they ACTUALLY want (ignore their profile settings)
    2. How they REALLY connect
    3. When they're TRULY active
    4. What KILLS attraction
    5. Success formulas that WORK
    
    Be BRUTALLY HONEST - use actual behavior, not hopeful thinking
    If they say "masc" but favorite/call/hookup with fems, say FEMS!
    
    Return complete UltimatePrefPattern as JSON
    `;

    const eros = getErosClient();
    const response = await makeErosRequest(() => 
      eros.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from EROS API');
    }
    const ultimatePattern: UltimatePrefPattern = JSON.parse(content);
    
    // Store the ultimate pattern
    const supabase = getSupabaseClient();
    await supabase
      .from('ultimate_preference_patterns')
      .upsert({
        user_id: userId,
        pattern: ultimatePattern,
        data_sources: {
          favorites_count: favorites.patterns?.length || 0,
          calls_analyzed: callHistory.videoCallPatterns?.length || 0,
          blocks_analyzed: blockPatterns.blockPatterns?.length || 0
        },
        confidence_score: calculateConfidence(favorites, callHistory, blockPatterns),
        learned_at: new Date().toISOString()
      });
    
    return ultimatePattern;
  } catch (error) {
    console.error('Eros Ultimate Learning Error:', error);
    throw error;
  }
}

// ============================================
// 5. 🔮 PREDICTIVE MATCHING 2.0
// ============================================

export async function predictiveMatch(
  userId: string,
  candidateProfile: any,
  ultimatePattern: UltimatePrefPattern
): Promise<{
  overallScore: number;
  breakdown: {
    looksMatch: number;
    personalityMatch: number;
    timingMatch: number;
    chemistryPrediction: number;
    redFlags: number;
  };
  prediction: 'instant_favorite' | 'high_potential' | 'worth_trying' | 'likely_block';
  reasoning: string[];
  warnings: string[];
  suggestedApproach: string;
}> {
  try {
    const prompt = `
    You are EROS making a prediction based on DEEP behavioral learning.
    
    User's TRUE preferences (from ALL data):
    ${JSON.stringify(ultimatePattern)}
    
    Candidate profile:
    ${JSON.stringify(candidateProfile)}
    
    Score this match (0-100) based on:
    1. Looks match to favorites/calls: /25
    2. Personality match to successes: /25
    3. Timing compatibility: /15
    4. Chemistry prediction: /20
    5. Red flag check (deduct points): /15
    
    Predict outcome:
    - instant_favorite: They'll obsess over this person
    - high_potential: Strong hookup likelihood
    - worth_trying: Might work, worth a shot
    - likely_block: Has dealbreaker traits
    
    Include specific reasoning and warnings
    
    Return detailed analysis as JSON
    `;

    const eros = getErosClient();
    const response = await makeErosRequest(() => 
      eros.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from EROS API');
    }
    const prediction = JSON.parse(content);
    
    // Log prediction for later verification
    const supabase = getSupabaseClient();
    await supabase
      .from('match_predictions_v2')
      .insert({
        user_id: userId,
        candidate_id: candidateProfile.id,
        overall_score: prediction.overallScore,
        breakdown: prediction.breakdown,
        prediction: prediction.prediction,
        reasoning: prediction.reasoning,
        created_at: new Date().toISOString()
      });
    
    return prediction;
  } catch (error) {
    console.error('Eros Prediction Error:', error);
    throw error;
  }
}

// ============================================
// 6. 🎮 AUTO-PILOT MODE
// ============================================

export async function autoPilotMode(
  userId: string,
  settings: {
    autoSwipe: boolean;
    autoMessage: boolean;
    autoFilter: boolean;
    aggressiveness: 'passive' | 'balanced' | 'aggressive';
  }
): Promise<void> {
  try {
    if (!settings.autoSwipe && !settings.autoMessage && !settings.autoFilter) {
      return; // Nothing to do
    }
    
    // Get ultimate preferences
    const ultimatePattern = await learnUltimatePreferences(userId);
    
    // AUTO-FILTER: Hide profiles that match block patterns
    if (settings.autoFilter) {
      const supabase = getSupabaseClient();
      const { data: nearbyProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId);
      
      for (const profile of nearbyProfiles || []) {
        const prediction = await predictiveMatch(userId, profile, ultimatePattern);
        
        if (prediction.prediction === 'likely_block') {
          // Auto-hide this profile
          const supabaseClient = getSupabaseClient();
          await supabaseClient
            .from('hidden_profiles')
            .insert({
              user_id: userId,
              hidden_user_id: profile.id,
              reason: 'eros_auto_filter',
              details: prediction.warnings
            });
        }
      }
    }
    
    // AUTO-SWIPE: Like profiles that match patterns
    if (settings.autoSwipe) {
      const supabase = getSupabaseClient();
      const { data: candidates } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .limit(20);
      
      for (const candidate of candidates || []) {
        const prediction = await predictiveMatch(userId, candidate, ultimatePattern);
        
        if (
          (settings.aggressiveness === 'aggressive' && prediction.overallScore > 60) ||
          (settings.aggressiveness === 'balanced' && prediction.overallScore > 75) ||
          (settings.aggressiveness === 'passive' && prediction.overallScore > 85)
        ) {
          // Auto-like
          const supabaseClient = getSupabaseClient();
          await supabaseClient
            .from('likes')
            .insert({
              user_id: userId,
              liked_user_id: candidate.id,
              auto_liked: true,
              eros_score: prediction.overallScore
            });
        }
      }
    }
    
    // AUTO-MESSAGE: Send perfect openers
    if (settings.autoMessage) {
      const supabase = getSupabaseClient();
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', userId)
        .eq('messaged', false);
      
      for (const match of matches || []) {
        const supabaseClient = getSupabaseClient();
        const { data: matchProfile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', match.matched_user_id)
          .single();
        
        // Generate perfect opener based on patterns
        const opener = await generatePersonalizedOpener(userId, matchProfile, ultimatePattern);
        
        // Send message
        await supabaseClient
          .from('messages')
          .insert({
            sender_id: userId,
            receiver_id: match.matched_user_id,
            content: opener.message,
            auto_sent: true,
            eros_generated: true
          });
      }
    }
  } catch (error) {
    console.error('Eros AutoPilot Error:', error);
    throw error;
  }
}

// ============================================
// 7. 💬 ICEBREAKER GENERATOR (with caching)
// ============================================

// Cache similar requests based on interests
const icebreakerCache = new Map<string, any>();

export async function getIcebreaker(profile: {
  interests?: string[];
  id?: string;
  display_name?: string;
  about?: string;
  tags?: string[];
  kinks?: string[];
}): Promise<string> {
  // Create cache key from interests/tags/kinks
  const interests = profile.interests || profile.tags || profile.kinks || [];
  const cacheKey = interests.sort().join('-');
  
  // Check cache first
  if (icebreakerCache.has(cacheKey)) {
    return icebreakerCache.get(cacheKey);
  }
  
  try {
    const eros = getErosClient();
    const prompt = `
    Generate a perfect icebreaker message for this profile:
    
    Name: ${profile.display_name || 'Unknown'}
    About: ${profile.about || 'No bio'}
    Interests: ${interests.join(', ') || 'Not specified'}
    Tags: ${(profile.tags || []).join(', ') || 'None'}
    
    Create a personalized, engaging icebreaker that:
    1. References their interests naturally
    2. Is friendly but not too forward
    3. Shows genuine interest
    4. Is conversation-starting (not just "hey")
    5. Is appropriate for a hookup/dating app context
    
    Return ONLY the icebreaker message (no quotes, no explanation).
    `;
    
    const response = await makeErosRequest(() => 
      eros.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 150,
        response_format: { type: 'text' }
      })
    );
    
    const result = response.choices[0]?.message?.content?.trim() || "Hey! I noticed we have similar interests. Want to chat?";
    
    // Store in cache
    icebreakerCache.set(cacheKey, result);
    
    // Limit cache size (keep last 100 entries)
    if (icebreakerCache.size > 100) {
      const firstKey = icebreakerCache.keys().next().value;
      icebreakerCache.delete(firstKey);
    }
    
    return result;
  } catch (error) {
    console.error('Eros Icebreaker Error:', error);
    // Fallback message
    return "Hey! I noticed we have similar interests. Want to chat?";
  }
}

// ============================================
// 8. 🔄 BATCH MATCH ANALYSIS (process multiple at once)
// ============================================

export async function analyzeMatches(
  matches: Array<{
    id: string;
    display_name?: string;
    about?: string;
    age?: number;
    photos?: string[];
    tags?: string[];
    kinks?: string[];
    position?: string;
    height?: string;
    body_type?: string;
    ethnicity?: string;
    online?: boolean;
    dtfn?: boolean;
    party_friendly?: boolean;
    [key: string]: any;
  }>
): Promise<Array<{
  profileId: string;
  analysis: {
    overallScore: number;
    topTraits: string[];
    matchPotential: 'high' | 'medium' | 'low';
    suggestedIcebreaker?: string;
    redFlags: string[];
  };
}>> {
  if (!matches || matches.length === 0) {
    return [];
  }
  
  try {
    const eros = getErosClient();
    
    // Prepare profiles for batch analysis
    const profilesData = matches.map(match => ({
      id: match.id,
      display_name: match.display_name || 'Unknown',
      about: match.about || 'No bio',
      age: match.age,
      tags: match.tags || [],
      kinks: match.kinks || [],
      position: match.position,
      height: match.height,
      body_type: match.body_type,
      ethnicity: match.ethnicity,
      online: match.online,
      dtfn: match.dtfn,
      party_friendly: match.party_friendly
    }));
    
    const prompt = `
    Analyze these ${matches.length} profiles in a single batch:
    
    ${JSON.stringify(profilesData, null, 2)}
    
    For EACH profile, provide:
    1. Overall match score (0-100)
    2. Top 3 most attractive traits
    3. Match potential: 'high', 'medium', or 'low'
    4. Suggested icebreaker message (1 sentence)
    5. Any red flags or concerns
    
    Return as JSON array with this structure:
    [
      {
        "profileId": "uuid",
        "analysis": {
          "overallScore": 85,
          "topTraits": ["trait1", "trait2", "trait3"],
          "matchPotential": "high",
          "suggestedIcebreaker": "message here",
          "redFlags": ["flag1", "flag2"]
        }
      },
      ...
    ]
    `;
    
    const response = await makeErosRequest(() => 
      eros.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000, // More tokens for multiple profiles
        response_format: { type: 'json_object' }
      })
    );
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from EROS API');
    }
    
    const parsed = JSON.parse(content);
    
    // Handle both array response and object with results array
    let results: any[] = [];
    if (Array.isArray(parsed)) {
      results = parsed;
    } else if (parsed.results && Array.isArray(parsed.results)) {
      results = parsed.results;
    } else if (parsed.analyses && Array.isArray(parsed.analyses)) {
      results = parsed.analyses;
    } else {
      // Fallback: create results from individual keys
      results = Object.values(parsed).filter((item: any) => item && item.profileId) as any[];
    }
    
    // Ensure all matches have analyses (fill in missing ones)
    const analyzedIds = new Set(results.map((r: any) => r.profileId));
    for (const match of matches) {
      if (!analyzedIds.has(match.id)) {
        results.push({
          profileId: match.id,
          analysis: {
            overallScore: 50,
            topTraits: [],
            matchPotential: 'medium' as const,
            suggestedIcebreaker: "Hey! Want to chat?",
            redFlags: []
          }
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Eros Batch Analysis Error:', error);
    
    // Fallback: return basic analysis for all matches
    return matches.map(match => ({
      profileId: match.id,
      analysis: {
        overallScore: 50,
        topTraits: match.tags?.slice(0, 3) || [],
        matchPotential: 'medium' as const,
        suggestedIcebreaker: `Hey ${match.display_name || 'there'}! Want to chat?`,
        redFlags: []
      }
    }));
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getConversationHistory(userId: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('conversation_outcomes')
    .select('*')
    .eq('user_id', userId);
  return data;
}

async function getTapHistory(userId: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('taps')
    .select(`
      *,
      tapped_profile:profiles!tapped_user_id(*)
    `)
    .eq('user_id', userId);
  return data;
}

async function getViewPatterns(userId: string) {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('profile_views')
    .select(`
      *,
      viewed_profile:profiles!viewed_user_id(*)
    `)
    .eq('viewer_id', userId)
    .order('view_count', { ascending: false });
  return data;
}

function calculateConfidence(favorites: any, calls: any, blocks: any): number {
  // More data = higher confidence
  const dataPoints = 
    (favorites.patterns?.length || 0) * 10 +
    (calls.videoCallPatterns?.length || 0) * 5 +
    (blocks.blockPatterns?.length || 0) * 3;
  
  return Math.min(100, dataPoints);
}

async function generatePersonalizedOpener(
  userId: string,
  matchProfile: any,
  pattern: UltimatePrefPattern
) {
  // Use cached icebreaker generator
  const message = await getIcebreaker({
    interests: matchProfile.tags || matchProfile.kinks || [],
    id: matchProfile.id,
    display_name: matchProfile.display_name,
    about: matchProfile.about,
    tags: matchProfile.tags,
    kinks: matchProfile.kinks
  });
  
  return { message };
}

