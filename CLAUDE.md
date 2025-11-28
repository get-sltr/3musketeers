# CLAUDE.md - AI Assistant Guide for SLTR

> **SLTR** - "Rules Don't Apply" - A modern location-based social/dating app

## Project Overview

SLTR is a Next.js 14 application with a separate Express/Socket.io backend. It features real-time messaging, video calls, map/grid views of nearby users, AI-powered matching (EROS), and subscription tiers.

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- **Backend:** Express.js + Socket.io (separate service)
- **Database:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Video:** LiveKit, Daily.co
- **Maps:** Mapbox, Leaflet
- **AI:** Groq (Llama 3.3 70B) for EROS matching
- **Payments:** Stripe
- **Monitoring:** Sentry
- **Deployment:** Vercel (frontend), Railway (backend)

## Critical Safety Rules

**READ THIS FIRST - These rules are NON-NEGOTIABLE:**

1. **NEVER make changes without asking first**
2. **NEVER update dependencies** unless critical security fix
3. **NEVER refactor working code** without explicit request
4. **NEVER touch core architecture files** without approval
5. **NEVER delete files** without explicit permission
6. **NEVER commit .env files** to version control

### Before Any Change:
```bash
npm run backup:full      # Create backup first
npm run validate:pre     # Check current state
```

### After Any Change:
```bash
npm run validate:post    # Verify change worked
npm run build            # Check build (for critical files)
```

### If Something Breaks:
```bash
npm run restore:last     # Rollback immediately
```

## Directory Structure

```
/home/user/3musketeers/
├── src/                      # Frontend source code
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/              # API routes (Next.js)
│   │   ├── admin/            # Admin dashboard
│   │   ├── auth/             # Authentication pages
│   │   ├── messages/         # Messaging feature
│   │   ├── profile/          # User profiles
│   │   ├── settings/         # User settings
│   │   ├── map/              # Map view
│   │   ├── groups/           # Group features
│   │   ├── places/           # Venue/location features
│   │   └── ...
│   ├── components/           # React components
│   │   ├── ui/               # UI primitives
│   │   ├── grid/             # Grid view components
│   │   └── conference/       # Video call components
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # Zustand state stores
│   ├── lib/                  # Utilities and services
│   │   ├── supabase/         # Supabase client
│   │   ├── realtime/         # Real-time subscriptions
│   │   ├── privileges/       # Subscription features
│   │   └── actions/          # Server actions
│   ├── types/                # TypeScript type definitions
│   ├── i18n/                 # Internationalization (en, es, vi, fr, pt, zh)
│   └── styles/               # Global styles
├── backend/                  # Express + Socket.io backend
│   ├── server.js             # Main server (DO NOT MODIFY without approval)
│   ├── services/             # Backend services
│   ├── socket/               # Socket.io handlers
│   └── migrations/           # Backend-specific migrations
├── supabase/
│   └── migrations/           # Database migrations
├── sql/                      # SQL scripts and utilities
├── scripts/                  # Utility scripts
├── docs/                     # Documentation
└── public/                   # Static assets
```

## Locked Files - Explicit Approval Required

These files require EXPLICIT approval before ANY change:

- `src/app/layout.tsx` - Root layout
- `src/middleware.ts` - Next.js middleware
- `src/lib/supabase/client.ts` - Supabase client
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `backend/server.js` - Backend server
- All `.env` files - NEVER touch or commit
- All `.sql` files - Database schemas

## Development Commands

```bash
# Frontend
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run lint             # Run ESLint
npm run test             # Run Jest tests

# Backend (in /backend directory)
cd backend && npm start  # Start backend server
cd backend && npm run dev # Start with nodemon

# Validation & Safety
npm run backup:full      # Create full backup
npm run restore:last     # Restore from backup
npm run validate:pre     # Pre-change validation
npm run validate:post    # Post-change validation
npm run validate:full    # Full validation
npm run preflight        # Pre-deployment check
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Mapbox (Required for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=

# App URLs
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SOCKET_URL=

# Sentry (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# Backend specific
GROQ_API_KEY=           # For EROS AI
STRIPE_SECRET_KEY=      # For payments
```

## Key Features & Components

### 1. Authentication
- Supabase Auth with email/password
- Session management via middleware
- Files: `src/app/login/`, `src/app/signup/`, `src/middleware.ts`

### 2. User Grid/Map Views
- Grid view: `src/components/GridView.tsx`, `GridViewProduction.tsx`
- Map view: `src/components/MapView.tsx`, `MapViewSimple.tsx`
- Store: `src/stores/useGridStore.ts`, `useMapStore.ts`

### 3. Messaging
- Real-time chat via Supabase Realtime
- Files: `src/app/messages/`, `src/hooks/useChatRealtime.ts`
- Backend Socket.io for additional features

### 4. Video Calls
- LiveKit integration
- Components: `src/components/VideoCall.tsx`
- Store: `src/stores/useLiveKitStore.ts`

### 5. EROS AI System
- Behavior-based matching using Groq
- Analyzes: favorites, calls, blocks, views, messages
- API: `src/lib/eros-api.ts`
- Components: `src/components/ErosAI.tsx`, `ErosFloatingButton.tsx`
- Uses Groq's `llama-3.3-70b-versatile` model

### 6. Subscription Tiers
- Free, Member, Founder, Black Card
- Stripe integration for payments
- Files: `src/lib/privileges/`, `src/hooks/usePrivileges.ts`

### 7. Real-time Features
- Supabase Realtime for presence/updates
- Socket.io backend for messaging
- Hooks: `src/hooks/useRealtime.ts`, `usePresence.ts`

## State Management (Zustand)

```typescript
// Available stores in src/stores/
useGridStore     // Grid view state, filters
useMapStore      // Map view state, location
useUIStore       // UI state, modals, navigation
useUserStore     // Current user data
useLiveKitStore  // Video call state
usePresenceStore // Online presence
```

## API Routes Structure

```
/api/
├── create-checkout-session/  # Stripe checkout
├── daily/                    # Daily.co video
├── delete-account/           # Account deletion
├── emails/                   # Email sending
├── feedback/                 # User feedback
├── groups/                   # Group management
├── livekit-token/            # Video call tokens
├── stripe/                   # Payment webhooks
├── taps/                     # User interactions
├── validate/                 # Validation endpoints
├── venues/                   # Venue management
├── verify/                   # Email verification
└── webhooks/                 # External webhooks
```

## Database (Supabase)

### Key Tables
- `profiles` - User profiles with location, preferences
- `messages` / `conversations` - Messaging
- `favorites` - User favorites
- `blocks` / `blocked_users` - Block list
- `taps` - User interactions
- `groups` - Group chats
- `black_cards` - Premium membership cards

### Important Notes
- RLS (Row Level Security) is enabled
- Migrations in `supabase/migrations/`
- Use service key for admin operations only

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Target: ES2020
- strictNullChecks and noUncheckedIndexedAccess enabled

## Internationalization

Supported locales: `en`, `es`, `vi`, `fr`, `pt`, `zh`

Config: `src/i18n/config.ts`
Messages: `messages/` directory

## Testing

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

Jest with React Testing Library configured.

## Deployment

### Frontend (Vercel)
- Auto-deploys from main branch
- Config: `vercel.json`

### Backend (Railway)
- Config: `backend/railway.json`, `backend/Procfile`
- Manual deployment or CI/CD

### Docker
- `docker-compose.yml` for local development
- `Dockerfile` for containerized deployment

## Common Tasks

### Adding a New Page
1. Create directory in `src/app/[page-name]/`
2. Add `page.tsx` with component
3. Follow existing patterns for layout

### Adding a New Component
1. Create in `src/components/`
2. Use TypeScript interfaces for props
3. Follow existing naming conventions

### Adding a New API Route
1. Create directory in `src/app/api/[route-name]/`
2. Add `route.ts` with handlers
3. Use Supabase client from `@/lib/supabase/server`

### Modifying Database
1. Create migration in `supabase/migrations/`
2. Name format: `YYYYMMDD_description.sql`
3. Test locally before applying

## Troubleshooting

### Build Fails
```bash
npm run build          # Check for TypeScript errors
npx tsc --noEmit       # Type check only
```

### Supabase Connection Issues
- Verify environment variables
- Check RLS policies
- Review `src/lib/supabase/client.ts`

### Real-time Not Working
- Check Supabase Realtime is enabled
- Verify subscription channels
- Check backend Socket.io connection

## Documentation References

- `docs/ENVIRONMENT-SETUP.md` - Environment setup
- `docs/CURRENT_WORKING_STATE.md` - Feature status
- `docs/EROS.md` - EROS AI documentation
- `.cursor/AI_SAFETY_RULES.md` - Safety rules for AI assistants

## Contact & Resources

- Production: https://getsltr.com
- Supabase Dashboard: https://supabase.com
- Vercel Dashboard: https://vercel.com
- Railway Dashboard: https://railway.app

---

**Remember: Stability > Features. Working code > Perfect code. Always backup first.**
