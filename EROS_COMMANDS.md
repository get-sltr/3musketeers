# EROS Quick Command Reference

## Setup Commands

```bash
# 1. Go to backend directory
cd /Users/lastud/Desktop/3musketeers/backend

# 2. Install dependencies (if not done)
npm install

# 3. Test services
node test-eros-services.js

# 4. Start backend
npm start

# Or development mode with auto-reload
npm run dev
```

## Database Migration

```bash
# Open Supabase SQL Editor
open https://supabase.com/dashboard/project/bnzyzkmixfmylviaojbj/sql

# Copy migration file
cat /Users/lastud/Desktop/3musketeers/backend/migrations/002_eros_tables.sql

# Paste into SQL editor and run
```

## API Testing Commands

```bash
# Health check
curl http://localhost:3001/api/health

# EROS scheduler status (requires auth token)
curl http://localhost:3001/api/v1/eros/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test heartbeat (requires auth token)
curl -X POST http://localhost:3001/api/v1/heartbeat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"appActive":true,"screenOn":true}'

# Test EROS chat (requires auth token)
curl -X POST http://localhost:3001/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"Hello EROS!"}'

# Get daily matches (requires auth token)
curl http://localhost:3001/api/v1/matches/daily \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Debugging Commands

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process on port 3001 (if needed)
kill -9 $(lsof -ti:3001)

# Check environment variables
node -e "console.log(require('dotenv').config())"

# View backend logs (if running in background)
tail -f backend/logs/server.log

# Check Redis connection (if using Redis)
redis-cli ping
```

## Supabase SQL Queries

```sql
-- Check if EROS tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%pattern%' OR table_name LIKE '%eros%');

-- Count users with activity data
SELECT COUNT(*) FROM profiles WHERE last_active IS NOT NULL;

-- Check recent matches generated
SELECT user_id, COUNT(*) as match_count, MAX(created_at) as last_generated
FROM matches 
WHERE match_type = 'daily'
GROUP BY user_id
ORDER BY last_generated DESC
LIMIT 10;

-- View EROS processing queue
SELECT * FROM eros_processing_queue 
ORDER BY created_at DESC 
LIMIT 20;

-- Check ultimate preference patterns
SELECT user_id, confidence_score, learned_at
FROM ultimate_preference_patterns
ORDER BY learned_at DESC
LIMIT 10;
```

## File Locations

```
backend/
├── services/
│   ├── scheduler.js      # EROS Scheduler
│   ├── analyzer.js       # EROS Analyzer
│   └── matcher.js        # EROS Matcher
├── migrations/
│   └── 002_eros_tables.sql  # Database migrations
├── server.js             # Main backend server (modified)
├── test-eros-services.js # Service test script
├── EROS_SETUP.md         # Full setup guide
└── .env                  # Environment variables

frontend/
└── src/
    └── lib/
        └── eros-api.ts   # Client SDK (already exists)

docs/
├── EROS_IMPLEMENTATION_COMPLETE.md  # Implementation summary
├── EROS_ISSUES_REPORT.md            # Diagnostic report
└── EROS_COMMANDS.md                 # This file
```

## Environment Variables Required

```bash
# Backend .env
SUPABASE_URL=https://bnzyzkmixfmylviaojbj.supabase.co
SUPABASE_ANON_KEY=your_anon_key
PORT=3001
ANTHROPIC_API_KEY=your_claude_key
REDIS_URL=redis://localhost:6379  # Optional
```

## Common Issues & Fixes

### Backend won't start
```bash
# Check port conflict
lsof -i :3001

# Check .env file exists
ls -la backend/.env

# Verify Node version
node --version  # Should be 22.x
```

### Scheduler not processing
```bash
# Check scheduler status endpoint
curl http://localhost:3001/api/v1/eros/status \
  -H "Authorization: Bearer TOKEN"

# Check backend logs for errors
# Look for: "EROS Scheduler started"
```

### No matches generated
```bash
# Verify users have last_active set
# Run SQL: SELECT COUNT(*) FROM profiles WHERE last_active IS NOT NULL;

# Check if Anthropic key is set
node -e "console.log(process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET')"

# Manually trigger Phase 3 for testing (use SQL)
UPDATE profiles SET last_active = NOW() - INTERVAL '61 minutes' WHERE id = 'USER_ID';
```

## Production Deployment

```bash
# Railway deployment
railway up

# Or manual deployment
git add backend/services backend/migrations
git commit -m "feat: Add EROS AI backend services"
git push

# Set environment variables on Railway
railway variables set ANTHROPIC_API_KEY=your_key
railway variables set REDIS_URL=your_redis_url
```

## Monitoring

```bash
# Watch logs in real-time
npm start | grep "EROS"

# Check scheduler activity
watch -n 5 'curl -s http://localhost:3001/api/v1/eros/status -H "Authorization: Bearer TOKEN" | jq .scheduler'

# Monitor match generation
watch -n 30 'curl -s http://localhost:3001/api/v1/matches/daily -H "Authorization: Bearer TOKEN" | jq .count'
```

## Stop Services

```bash
# Graceful shutdown (Ctrl+C in terminal)
# Or send SIGTERM
kill -TERM $(lsof -ti:3001)

# Force kill
kill -9 $(lsof -ti:3001)
```
