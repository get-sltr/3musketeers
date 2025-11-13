# 🧠 EROS - The Intelligence Behind SLTR

## What is EROS?

EROS is SLTR's AI brain that learns what you ACTUALLY want, not what you think you want. It analyzes everything you do - favorites, calls, blocks, messages, views - to understand your TRUE preferences.

**Without EROS, SLTR is just another dating app.**
**With EROS, SLTR knows you better than you know yourself.**

## Why EROS Matters

Traditional apps show you what YOU say you want in your settings.
EROS shows you what you ACTUALLY respond to in real life.

Examples:
- You say "masc only" but favorite/call/hookup with fems → EROS shows you fems
- You say "no party" but always match with party guys → EROS prioritizes party-friendly
- You block anyone over 35 → EROS filters them automatically
- You only video call fit latinos 25-30 → EROS learns your type

## How EROS Works

### 1. Deep Learning Sources

EROS analyzes 6 behavioral data sources:

**💝 Favorites**
- Who you keep coming back to view
- Message frequency with favorites
- Common traits across all favorites

**📞 Video Call History**
- Who you actually call (vs who you message)
- Call duration patterns
- What leads to hookups after calls

**🚫 Block Patterns**
- Instant block triggers (≤3 messages)
- Common traits of blocked profiles
- Messages that cause blocks

**👉 Tap Interactions**
- Who you tap vs who taps you
- Reciprocation rates
- Taps that lead to meetings

**👀 View Patterns**
- Profiles you view repeatedly
- How long you look at each photo
- Scroll depth on profiles

**💬 Conversation Outcomes**
- What openers get responses
- Conversation patterns that work
- Escalation speed to meetings

### 2. AI Models

EROS uses **Groq** (not OpenAI/Claude) because:
- ✅ **FREE** - No API costs
- ✅ **FAST** - Sub-second responses
- ✅ **HIGH LIMITS** - 14,400 requests/day
- ✅ **Llama 3.3 70B** - State-of-the-art model

Model: `llama-3.3-70b-versatile`

### 3. What EROS Learns

**Ultimate Preference Pattern:**
```typescript
{
  actualTypePreferences: {
    age_range: [25, 32],
    body_types: ["athletic", "muscular"],
    ethnicities: ["latino", "mixed"],
    positions: ["vers bottom"],
    relationship_styles: ["casual", "fwb"],
    personality_traits: ["direct", "confident"]
  },

  connectionPatterns: {
    preferred_first_contact: "tap",
    message_style: "flirty",
    escalation_speed: "same_day",
    video_call_threshold: 5,  // messages before video
    meeting_threshold: 2  // days before meeting
  },

  temporalPatterns: {
    most_active_hours: [20, 21, 22, 23],  // 8pm-11pm
    most_active_days: ["Friday", "Saturday"],
    hookup_days: ["Saturday", "Sunday"],
    chat_only_times: ["weekday afternoons"]
  },

  dealbreakers: {
    instant_blocks: ["smoker", "over 40", "aggressive messages"],
    conversation_killers: ["one word replies", "unsolicited nudes"],
    ghost_triggers: ["clingy", "too many questions"],
    red_flags: ["drama", "drugs", "married"]
  },

  successFormulas: {
    perfect_match_traits: ["fit", "25-30", "latino", "confident"],
    ideal_conversation_flow: ["flirty opener", "quick banter", "suggest video", "plan meetup"],
    optimal_escalation_path: ["tap", "message", "video call same day", "meet next day"],
    meeting_success_factors: ["weekends", "evening", "casual vibe"]
  }
}
```

## EROS Features

### 1. 🔍 Deep Behavior Analysis
```typescript
// Analyze what someone REALLY likes from favorites
await analyzeFavorites(userId)

// Learn from video call patterns
await analyzeCallHistory(userId)

// Understand dealbreakers from blocks
await analyzeBlockPatterns(userId)
```

### 2. 🎯 Ultimate Learning
```typescript
// Combine ALL data sources for complete picture
const pattern = await learnUltimatePreferences(userId)
```

### 3. 🔮 Predictive Matching
```typescript
// Score any profile 0-100 based on learned patterns
const prediction = await predictiveMatch(userId, candidateProfile, pattern)

// Results:
// - instant_favorite (they'll obsess)
// - high_potential (strong hookup likelihood)
// - worth_trying (might work)
// - likely_block (has dealbreakers)
```

### 4. 💬 Perfect Icebreakers
```typescript
// AI-generated openers based on profile
const message = await getIcebreaker(profile)

// Examples:
// "I see you're into hiking - ever done Runyon Canyon at sunrise?"
// "Damn, a fellow gym rat! What's your split?"
// "That pic in Barcelona - Sagrada Familia is insane right?"
```

### 5. 🎮 Auto-Pilot Mode
```typescript
await autoPilotMode(userId, {
  autoSwipe: true,      // Auto-like high matches
  autoMessage: true,    // Send perfect openers
  autoFilter: true,     // Hide likely blocks
  aggressiveness: 'balanced'  // passive | balanced | aggressive
})
```

### 6. 📊 Batch Analysis
```typescript
// Analyze multiple matches at once
const analyses = await analyzeMatches(profiles)

// Returns scores, traits, and icebreakers for all
```

## How to Use EROS

### Via Floating Button (EROS Assistive Touch)

**Short Press:**
- Triggers silent ultimate preference learning
- Runs in background
- Updates your pattern

**Long Press Menu → AI Mode:**
- Triggers full EROS analysis
- Analyzes all data sources
- Updates match predictions

### Via API Endpoints

All endpoints at `/api/eros/*`:

1. **`/api/eros/analyze`** - Main analysis endpoint
   ```typescript
   POST /api/eros/analyze
   {
     "userId": "uuid",
     "analysisType": "ultimate" | "favorites" | "calls" | "blocks"
   }
   ```

2. **`/api/eros/icebreaker`** - Generate opener
   ```typescript
   POST /api/eros/icebreaker
   {
     "profile": { ...profileData }
   }
   ```

3. **`/api/eros/autopilot`** - Enable auto-pilot
   ```typescript
   POST /api/eros/autopilot
   {
     "userId": "uuid",
     "settings": {
       "autoSwipe": true,
       "autoMessage": true,
       "autoFilter": true,
       "aggressiveness": "balanced"
     }
   }
   ```

4. **`/api/eros/predict`** - Predict match score
   ```typescript
   POST /api/eros/predict
   {
     "userId": "uuid",
     "candidateProfile": { ...profileData }
   }
   ```

5. **`/api/eros/analyze-batch`** - Batch analysis
   ```typescript
   POST /api/eros/analyze-batch
   {
     "profiles": [ ...profilesArray ]
   }
   ```

## EROS in Action

### Scenario 1: New User Profile
1. User signs up, sets preferences
2. EROS starts silent learning from first interaction
3. After 10 favorites, 5 calls, 3 blocks → pattern emerges
4. EROS updates match scores automatically
5. Feed now shows REAL matches, not stated preferences

### Scenario 2: Auto-Pilot Weekend
1. Friday 8pm: User enables auto-pilot (aggressive)
2. EROS analyzes 50 nearby profiles
3. Auto-likes 15 high-potential matches (>75 score)
4. Auto-filters 10 likely blocks
5. When matches happen, sends perfect openers
6. User wakes up Saturday with 5 conversations started

### Scenario 3: Icebreaker Help
1. User gets match but doesn't know what to say
2. Taps EROS button → requests icebreaker
3. EROS analyzes match's profile + learned patterns
4. Generates personalized opener referencing interests
5. User sends message, gets response

## Database Tables Used by EROS

EROS stores learned patterns:

- `favorite_patterns` - Favorite analysis results
- `block_patterns` - Block trigger patterns
- `ultimate_preference_patterns` - Complete user preference profile
- `match_predictions_v2` - Prediction logs for verification
- `call_history` - Video/voice call tracking
- `conversation_outcomes` - Message success tracking
- `profile_views` - View pattern tracking

## Configuration

### Environment Variables

```env
# Required
GROQ_API_KEY=gsk_your_key_here

# Supabase (for data access)
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_service_key
```

### Rate Limits

Groq Free Tier:
- 14,400 requests/day
- ~10 requests/minute sustained
- EROS includes automatic retry with exponential backoff

## EROS Philosophy

**"Show people what they DO, not what they SAY"**

Traditional dating apps fail because they trust stated preferences.
People lie to themselves about what they want.

EROS doesn't care what you wrote in your bio.
EROS watches what you actually do:
- Who you favorite
- Who you call
- Who you block
- Who you meet

**The data doesn't lie.**

## Future EROS Features

Coming soon:
- Voice pattern analysis (tone, speed, energy)
- Photo preference learning (facial features, style, body language)
- Optimal message timing predictions
- Hookup success probability scores
- "Your Type" yearly summary
- Group chat compatibility analysis
- Event recommendation engine

---

**EROS is what makes SLTR different from every other hookup app.**

It's not just smart matching - it's learning your deepest patterns and using them to find connections that actually work.

The more you use SLTR, the smarter EROS gets.
The smarter EROS gets, the better your matches become.

**SLTR = Stay True. Live Real.**
**EROS = Know Yourself. Find Your Match.**
