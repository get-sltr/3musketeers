# SLTR Deployment Guide

## Vercel Deployment

### Required Environment Variables

Add these environment variables in your Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
NODE_ENV=production
```

### Critical Environment Variables for Production

```
# Supabase (REQUIRED) - Get from Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production

# Mapbox (REQUIRED for maps) - Get from Mapbox Dashboard
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token_here

# Railway Backend (REQUIRED for real-time)
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app

# EROS Deep Learning (REQUIRED for AI features)
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Daily.co Video Calling (REQUIRED for video calls)
DAILY_API_KEY=your_daily_co_api_key_here

# Resend Email Service (REQUIRED for emails)
RESEND_API_KEY=re_your_resend_api_key_here
```

## Railway Deployment (Backend)

The backend runs on Railway and doesn't need these frontend environment variables.

## Build Commands

- **Build**: `npm run build`
- **Start**: `npm start`
- **Framework**: Next.js
