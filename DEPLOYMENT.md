# SLTR Deployment Guide

## Vercel Deployment

### Required Environment Variables

Add these environment variables in your Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Optional Environment Variables

None currently needed.

## Railway Deployment (Backend)

The backend runs on Railway and doesn't need these frontend environment variables.

## Build Commands

- **Build**: `npm run build`
- **Start**: `npm start`
- **Framework**: Next.js
