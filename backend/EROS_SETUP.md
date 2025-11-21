# EROS Backend Setup Guide
**Clean • Reliable • Scalable • Functional • Sustainable**

## Prerequisites

- Node.js 22.x
- PostgreSQL (via Supabase)
- Redis (optional, for scaling)
- Anthropic API key (for AI features)

## Installation

```bash
cd backend
npm install
```

## Database Setup

### 1. Run Migrations

Execute the SQL migration file in your Supabase SQL Editor:

```bash
# Copy the migration file content
cat migrations/002_eros_tables.sql

# Then paste and run in Supabase SQL Editor:
# https://supabase.com/dashboard/project/YOUR_PROJECT/sql
```

Or use Supabase CLI:

```bash
supabase db push
```

### 2. Verify Tables Created

Run this SQL to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%pattern%' OR table_name LIKE '%eros%';
```

You should see:
- `favorite_patterns`
- `message_behavior_patterns`
- `block_patterns`
- `ultimate_preference_patterns`
- `match_predictions_v2`
- `call_history`
- `block_history`
- `eros_processing_queue`

## Environment Variables

Ensure your `.env` file has:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key

# Server
PORT=3001
NODE_ENV=development

# AI (required for EROS intelligence)
ANTHROPIC_API_KEY=your_claude_api_key

# Redis (optional, for scaling)
REDIS_URL=redis://localhost:6379

# Frontend URLs
FRONTEND_URL=https://getsltr.com
DEV_FRONTEND_URL=http://localhost:5000
```

## Starting the Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

## Verify EROS is Running

### 1. Check Backend Health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-21T...",
  "version": "3.0.0-PRODUCTION",
  "redis": "connected"
}
```

### 2. Check EROS Scheduler Status

```bash
curl http://localhost:3001/api/v1/eros/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "scheduler": {
    "running": true,
    "activeWorkers": 0,
    "queuedJobs": 0,
    "workers": []
  }
}
```

### 3. Test EROS Chat

```bash
curl -X POST http://localhost:3001/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "Hello EROS!"}'
```

### 4. Test Daily Matches

```bash
curl http://localhost:3001/api/v1/matches/daily \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## How EROS Works

### 1. User Activity Monitoring

When frontend sends heartbeat:
```
POST /api/v1/heartbeat
{
  "appActive": true,
  "screenOn": true
}
```

EROS tracks:
- Last active timestamp
- Online status
- Idle time calculation

### 2. Off-Peak Processing Phases

**Phase 1** (10+ min idle):
- Light pattern extraction
- Cache favorites
- CPU: 5%

**Phase 2** (30+ min idle):
- Medium analysis
- Analyze messages & favorites
- CPU: 15%

**Phase 3** (60+ min idle):
- Deep AI analysis
- Generate daily matches
- CPU: 80%

### 3. Adaptive Halting

When user becomes active:
- Scheduler immediately halts processing
- Removes user from queue
- Serves cached results instantly

## Architecture

```
┌──────────────┐
│   Frontend   │
│ (Next.js)    │
└──────┬───────┘
       │ HTTP/REST
       ▼
┌──────────────────────────────────┐
│     Backend Server (Express)     │
│  ┌────────────────────────────┐  │
│  │   API Endpoints            │  │
│  │   /api/v1/heartbeat        │  │
│  │   /api/v1/matches/daily    │  │
│  │   /api/v1/assistant/chat   │  │
│  └────────────────────────────┘  │
│              │                    │
│  ┌───────────▼─────────────────┐ │
│  │   EROS Scheduler            │ │
│  │   - Monitors idle time      │ │
│  │   - Queues jobs             │ │
│  │   - Manages workers         │ │
│  └───────────┬─────────────────┘ │
│              │                    │
│  ┌───────────▼─────────────────┐ │
│  │   Services                  │ │
│  │   - Analyzer (patterns)     │ │
│  │   - Matcher (scoring)       │ │
│  └───────────┬─────────────────┘ │
└──────────────┼──────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
     ▼         ▼         ▼
┌─────────┐ ┌─────┐ ┌──────────┐
│Supabase │ │Redis│ │Anthropic │
│(DB)     │ │Cache│ │(Claude)  │
└─────────┘ └─────┘ └──────────┘
```

## Monitoring

### Logs to Watch

When backend starts:
```
✅ EROS Scheduler started
🚀 SLTR Backend v3.0-PRODUCTION running on port 3001
💘 EROS AI Matchmaker: ACTIVE
```

When user idles:
```
📋 Queued PHASE_1 processing for user abc12345... (idle: 12m)
🔄 Starting PHASE_1 worker for abc12345... (CPU limit: 5%)
🔍 Phase 1 analysis for abc12345...
✅ PHASE_1 worker completed for abc12345...
```

When user becomes active:
```
⏸️  Halted processing for abc12345... (user became active)
```

When matches generated:
```
💘 Generating daily matches for abc12345...
✅ Generated 10 matches for abc12345...
```

## Troubleshooting

### Backend won't start

1. Check port availability:
```bash
lsof -i :3001
```

2. Verify environment variables:
```bash
node -e "console.log(require('dotenv').config())"
```

### Scheduler not running

Check logs for:
- `EROS Scheduler already running` (good)
- `EROS Scheduler starting...` (good)
- Errors connecting to Supabase

### No matches generated

1. Check if users have data:
```sql
SELECT COUNT(*) FROM profiles WHERE last_active IS NOT NULL;
```

2. Check scheduler status endpoint
3. Verify Anthropic API key is set

### Database connection errors

1. Verify Supabase credentials in `.env`
2. Check Supabase project is active
3. Verify RLS policies don't block service account

## Performance Tuning

### Adjust Processing Thresholds

Edit `services/scheduler.js`:

```javascript
const PHASE_THRESHOLDS = {
  PHASE_1: 5 * 60 * 1000,   // 5 min instead of 10
  PHASE_2: 15 * 60 * 1000,  // 15 min instead of 30
  PHASE_3: 30 * 60 * 1000,  // 30 min instead of 60
};
```

### Adjust Check Interval

```javascript
const scheduler = getScheduler({ 
  checkInterval: 60000  // 60 seconds instead of 30
});
```

### Limit Concurrent Workers

Edit `getMaxWorkers()` in `scheduler.js`:

```javascript
getMaxWorkers() {
  return 4; // Fixed limit instead of CPU-based
}
```

## Next Steps

1. Deploy to Railway/production
2. Set up monitoring (Sentry, Datadog)
3. Configure Redis for multi-server scaling
4. Add job queue persistence
5. Implement worker health checks
6. Add A/B testing for matching algorithms

## Support

For issues or questions:
- Check logs in `backend/`
- Review Supabase SQL logs
- Verify all migrations ran successfully
