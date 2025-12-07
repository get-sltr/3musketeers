# EROS Backend Documentation

## Overview

This `backend/` folder contains the **EROS AI Matchmaking Backend** - the core engine that powers intelligent matching and AI-assisted dating features for SLTR.

⚠️ **Note:** Despite being named `backend/`, this is specifically the **EROS Backend**, not a generic backend.

## Architecture

```
3musketeers/
├── backend/                    ← EROS Backend (this folder)
│   ├── server.js              ← Main Express server
│   ├── services/
│   │   ├── scheduler.js       ← EROS Scheduler (monitors user activity)
│   │   ├── analyzer.js        ← EROS Analyzer (learns preferences)
│   │   └── matcher.js         ← EROS Matcher (generates matches)
│   ├── socket/                ← Real-time Socket.io handlers
│   ├── migrations/            ← Database migrations
│   └── package.json
│
├── src/                        ← Frontend (Next.js)
│   ├── lib/eros-api.ts        ← EROS API client
│   ├── components/ErosAI.tsx  ← EROS Chat UI
│   └── ...
│
└── next.config.js             ← Frontend config (includes CSP for EROS)
```

## Deployment

### Production
- **URL:** `https://eros-backend.getsltr.com`
- **Platform:** Railway
- **Environment:** `production`

### Local Development
- **URL:** `http://localhost:3001`
- **Command:** `npm start` or `npm run dev`

## Key Components

### 1. EROS Scheduler (`services/scheduler.js`)
Monitors user idle time and triggers processing phases:
- **Phase 1** (10+ min idle): Light pattern extraction (5% CPU)
- **Phase 2** (30+ min idle): Medium analysis (15% CPU)
- **Phase 3** (60+ min idle): Deep AI analysis + match generation (80% CPU)

### 2. EROS Analyzer (`services/analyzer.js`)
Learns user preferences by analyzing:
- Favorite patterns
- Message behavior
- Block patterns
- Call history
- Uses Claude AI for deep learning

### 3. EROS Matcher (`services/matcher.js`)
Generates daily matches using:
- Learned preference patterns
- Profile completeness scoring
- Mutual interest detection
- Activity status
- Proximity calculation

### 4. EROS Chat (`server.js` - `/api/v1/assistant/chat`)
AI-powered chat assistant using Claude Haiku model:
- Dating advice
- Profile tips
- Conversation starters
- Message translation

## API Endpoints

### Heartbeat & Activity
- `POST /api/v1/heartbeat` - Track user activity
- `GET /api/v1/activity/status` - Get activity status

### Matches
- `GET /api/v1/matches/daily` - Get daily matches
- `POST /api/v1/matches/:matchId/action` - Like/skip/block match

### Assistant (Chat)
- `POST /api/v1/assistant/chat` - Chat with EROS AI
- `POST /api/v1/assistant/ask` - Ask a question
- `POST /api/v1/assistant/translate` - Translate message
- `POST /api/v1/assistant/advice` - Get dating advice

### Health
- `GET /api/health` - Health check
- `GET /api/v1/eros/status` - EROS scheduler status

## Configuration

### Environment Variables
```bash
# Supabase
SUPABASE_URL=https://bnzyzkmixfmylviaojbj.supabase.co
SUPABASE_ANON_KEY=...

# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# Redis (for scaling)
REDIS_URL=redis://...

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://getsltr.com
```

### Claude Model
- **Model:** `claude-3-haiku-20240307`
- **Why Haiku:** Fast, cost-effective, perfect for real-time chat
- **Max Tokens:** 1024 for analysis, 1024 for chat

## Frontend Integration

### EROS API Client (`src/lib/eros-api.ts`)
```typescript
import { erosAPI } from '@/lib/eros-api'

// Chat with EROS
const response = await erosAPI.chat('Help me with my profile')

// Get daily matches
const matches = await erosAPI.getDailyMatches(10)

// Send heartbeat
await erosAPI.sendHeartbeat(true, true)
```

### EROS Chat Component (`src/components/ErosAI.tsx`)
- Floating 🏹 button (draggable)
- Real-time chat interface
- Quick action buttons
- Premium feature gating

## Database Schema

### EROS Tables
- `matches` - Daily match recommendations
- `match_actions` - User interactions (like/skip/block)
- `assistant_conversations` - Chat history
- `favorite_patterns` - Learned favorite traits
- `message_behavior_patterns` - Message style analysis
- `block_patterns` - Dealbreakers and red flags
- `ultimate_preference_patterns` - Final preference model
- `match_predictions_v2` - Match scoring data
- `call_history` - Video call records
- `block_history` - Block event tracking
- `eros_processing_queue` - Job queue for analysis

## Security

### CORS
- Allowed origins: `https://getsltr.com`, `http://localhost:3000`
- Credentials: Enabled
- Methods: GET, POST, PUT, DELETE

### CSP (Content Security Policy)
Frontend allows connections to:
- `https://eros-backend.getsltr.com` ✅
- `https://*.supabase.co` ✅
- `https://api.mapbox.com` ✅

### Authentication
- Supabase JWT tokens required for all endpoints
- Token validation on every request
- Session refresh on 401 errors

### Rate Limiting
- General: 100 requests per 15 minutes
- Auth: 5 attempts per 15 minutes
- Upload: 10 files per minute

## Troubleshooting

### EROS Chat Not Working
1. Check CSP allows `eros-backend.getsltr.com`
2. Verify `ANTHROPIC_API_KEY` is set
3. Check Claude model is `claude-3-haiku-20240307`
4. Verify Supabase connection

### No Matches Generated
1. Check scheduler is running: `GET /api/v1/eros/status`
2. Verify user has idle time (10+ minutes)
3. Check database has user data
4. Review scheduler logs

### Redis Connection Issues
1. Backend falls back to single-server mode automatically
2. Check `REDIS_URL` is correct
3. Verify Redis is accessible from Railway

## Development

### Local Setup
```bash
cd backend
npm install
npm run dev
```

### Testing
```bash
# Test EROS services
node test-eros-services.js

# Test API key
node test-api-fixed.js
```

### Deployment
```bash
git add .
git commit -m "fix: EROS update"
git push origin main
# Railway auto-deploys
```

## Performance

### Optimization Tips
1. **Adjust phase thresholds** in `services/scheduler.js`
2. **Limit concurrent workers** based on CPU
3. **Use Redis** for multi-server scaling
4. **Cache matches** for 24 hours

### Monitoring
- Check logs: Railway dashboard
- Health endpoint: `https://eros-backend.getsltr.com/api/health`
- EROS status: `https://eros-backend.getsltr.com/api/v1/eros/status`

## Future Improvements

- [ ] Add more Claude models (Opus for deep analysis)
- [ ] Implement A/B testing for matching algorithms
- [ ] Add webhook notifications
- [ ] Implement job persistence with Redis
- [ ] Add worker health checks
- [ ] Implement rate limiting per user

## Support

For issues or questions:
1. Check Railway logs
2. Review Supabase SQL logs
3. Test API endpoints directly
4. Check environment variables
5. Verify database migrations ran

---

**Last Updated:** December 2025
**Status:** Production Ready ✅
**Model:** Claude 3 Haiku
**Deployment:** Railway
