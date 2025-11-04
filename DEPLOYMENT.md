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
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://bnzyzkmixfmylviaojbj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuenl6a21peGZteWx2aWFvamJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDE3ODksImV4cCI6MjA3NTAxNzc4OX0.8WHWwe9ow_nTljMvwVUI70i07pmNBh2mR0yo80EsGMs

# App Configuration (REQUIRED)
NEXT_PUBLIC_APP_URL=https://3musketeers.vercel.app
NODE_ENV=production

# Mapbox (REQUIRED for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoic2x0ciIsImEiOiJjbWgwY3cxenUwMTMxMmtvZDFuYTdyN2xiIn0.HlQWna4dS1678IuOU4r8BA

# Railway Backend (REQUIRED for real-time)
NEXT_PUBLIC_BACKEND_URL=https://sltr-backend.railway.app

# EROS Deep Learning (REQUIRED for AI features)
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
```

## Railway Deployment (Backend)

The backend runs on Railway and doesn't need these frontend environment variables.

## Build Commands

- **Build**: `npm run build`
- **Start**: `npm start`
- **Framework**: Next.js
