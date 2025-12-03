# CLAUDE.md - AI Assistant Guide for SLTR

> **SLTR** - "Rules Don't Apply" - A modern location-based social/dating app

## Project Overview

SLTR is a Next.js 14 application with a separate Express/Socket.io backend. It features real-time messaging, video calls, map/grid views of nearby users, AI-powered matching (EROS), and subscription tiers.

**Tech Stack:**
- **Frontend:** Next.js 14.2.33 (App Router), TypeScript 5.4.5, Tailwind CSS 3.4.1, Zustand 5.0.8
- **Backend:** Express.js 4.18.2 + Socket.io 4.7.4 (separate service)
- **Database:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Video:** LiveKit, Daily.co
- **Maps:** Mapbox GL JS 2.15.0
- **AI:** Groq (Llama 3.3 70B) for EROS matching
- **Payments:** Stripe 19.2.1
- **Monitoring:** Sentry 10.25.0
- **Deployment:** Vercel (frontend), Railway (backend)
- **Runtime:** Node.js 22.x

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
├── src/                          # Frontend source code
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API routes (Next.js)
│   │   │   ├── create-checkout-session/  # Stripe checkout
│   │   │   ├── daily/            # Daily.co video rooms
│   │   │   ├── delete-account/   # Account deletion
│   │   │   ├── emails/           # Email sending (welcome, password-reset, auth-verification)
│   │   │   ├── feedback/         # User feedback
│   │   │   ├── groups/           # Group management
│   │   │   ├── livekit-token/    # Video call tokens
│   │   │   ├── mapbox-token/     # Mapbox token endpoint
│   │   │   ├── stripe/           # Stripe checkout & payments
│   │   │   ├── taps/             # User interactions
│   │   │   ├── validate/         # Validation endpoints
│   │   │   ├── venues/           # Venue management (search, lgbtq)
│   │   │   ├── verify/           # Email verification & code redemption
│   │   │   └── webhooks/         # Stripe & Supabase webhooks
│   │   ├── admin/                # Admin dashboard (black-cards)
│   │   ├── auth/callback/        # Auth callback handler
│   │   ├── black-card/[cardNumber]/ # Black card display
│   │   ├── blocked-users/        # Blocked users management
│   │   ├── channels/[id]/        # Channel pages
│   │   ├── checkout/[tier]/      # Checkout flow
│   │   ├── founders-circle/      # Founders circle page
│   │   ├── groups/               # Groups feature (channels, detail)
│   │   ├── holo-map/             # Holographic map view
│   │   ├── login/                # User login
│   │   ├── messages/             # Messaging (list & [id] detail)
│   │   ├── places/[id]/          # Places/venues detail
│   │   ├── pricing/              # Pricing page
│   │   ├── profile/              # User profiles (own & [userId])
│   │   ├── settings/             # User settings
│   │   ├── signup/               # User registration
│   │   ├── sltr-plus/            # SLTR+ subscription page
│   │   ├── taps/                 # Taps/interactions page
│   │   ├── verify/               # Email verification
│   │   ├── viewed/               # Profile views
│   │   └── [legal pages]/        # terms, privacy, guidelines, cookies, security, legal, help
│   ├── components/               # React components (~60 components)
│   │   ├── ui/                   # UI primitives (StatusChip)
│   │   ├── grid/                 # Grid view components (GridCard)
│   │   ├── conference/           # Video call components (CameraRequestBanner)
│   │   ├── GridView.tsx          # Main grid view
│   │   ├── GridViewProduction.tsx # Production grid
│   │   ├── MapViewSimple.tsx     # Simple map view
│   │   ├── VideoCall.tsx         # Video call component
│   │   ├── ConferenceRoom.tsx    # Conference room
│   │   ├── ErosAI.tsx            # EROS AI component
│   │   ├── ErosFloatingButton.tsx # EROS floating button
│   │   ├── ErosMatchFinder.tsx   # Match finding
│   │   ├── UserProfileModal.tsx  # Profile modal
│   │   ├── MessagingModal.tsx    # Messaging modal
│   │   ├── BottomNav.tsx         # Mobile navigation
│   │   └── ...                   # Many more components
│   ├── hooks/                    # Custom React hooks (~24 hooks)
│   │   ├── useUser.ts            # Current user hook
│   │   ├── usePrivileges.ts      # Subscription privileges
│   │   ├── usePresence.ts        # Online presence
│   │   ├── useRealtime.ts        # Realtime subscriptions
│   │   ├── useChatRealtime.ts    # Chat realtime
│   │   ├── useGroupRealtime.ts   # Group realtime
│   │   ├── useMapRealtime.ts     # Map realtime
│   │   ├── useLiveKitRoom.ts     # LiveKit video
│   │   ├── useSecureSocket.ts    # Secure socket connection
│   │   ├── useNotifications.ts   # Push notifications
│   │   ├── useUsageLimits.ts     # Usage limit tracking
│   │   └── ...
│   ├── stores/                   # Zustand state stores
│   │   ├── useGridStore.ts       # Grid view state, filters
│   │   ├── useMapStore.ts        # Map view state, location
│   │   ├── useUIStore.ts         # UI state, modals, navigation
│   │   ├── useUserStore.ts       # Current user data
│   │   ├── useLiveKitStore.ts    # Video call state
│   │   ├── usePresenceStore.ts   # Online presence
│   │   └── index.ts              # Store exports
│   ├── lib/                      # Utilities and services
│   │   ├── supabase/             # Supabase clients
│   │   │   ├── client.ts         # Browser client (DO NOT MODIFY)
│   │   │   └── server.ts         # Server client
│   │   ├── privileges/           # Subscription features
│   │   │   ├── config.ts         # Tier configuration
│   │   │   ├── checker.ts        # Permission checker
│   │   │   ├── middleware.ts     # Privilege middleware
│   │   │   ├── cache.ts          # Privilege caching
│   │   │   └── types.ts          # Type definitions
│   │   ├── realtime/             # Real-time subscriptions
│   │   │   └── RealtimeManager.ts # Realtime manager
│   │   ├── actions/              # Server actions
│   │   │   └── verificationActions.ts
│   │   ├── maps/                 # Map utilities
│   │   │   └── getMapboxToken.ts
│   │   ├── utils/                # Utility functions
│   │   │   ├── url.ts
│   │   │   └── profile.ts
│   │   ├── types/                # Shared types
│   │   │   └── profile.ts
│   │   ├── eros-api.ts           # EROS AI API
│   │   ├── sentry.ts             # Sentry configuration
│   │   ├── safety.ts             # Safety utilities
│   │   ├── rateLimit.ts          # Rate limiting
│   │   └── profileTracking.ts    # Profile tracking
│   ├── types/                    # TypeScript type definitions
│   │   ├── app.ts                # App types
│   │   ├── livekit.ts            # LiveKit types
│   │   └── pins.ts               # Map pins types
│   ├── i18n/                     # Internationalization
│   │   └── config.ts             # Locale configuration
│   └── styles/                   # Global styles
│       └── SLTRMapPin.css        # Map pin styles
├── backend/                      # Express + Socket.io backend
│   ├── server.js                 # Main server (DO NOT MODIFY without approval)
│   ├── services/                 # Backend services
│   │   ├── analyzer.js           # EROS behavior analyzer
│   │   ├── matcher.js            # EROS matching engine
│   │   └── scheduler.js          # Background job scheduler
│   ├── migrations/               # Backend-specific migrations
│   │   └── 002_create_eros_tables.sql
│   ├── package.json              # Backend dependencies
│   └── env.example               # Backend env template
├── supabase/
│   └── migrations/               # Database migrations (25+ migrations)
├── sql/                          # SQL scripts and utilities
├── scripts/                      # Utility scripts
│   ├── backup-project.js         # Create project backup
│   ├── restore-backup.js         # Restore from backup
│   ├── validate-project.js       # Project validation
│   ├── daily-log.js              # Daily logging
│   ├── generate-icons.js         # Icon generation
│   ├── generate_black_cards.js   # Black card generation
│   ├── apply-rls-migration.js    # RLS migration
│   ├── check-blocks.js           # Block checking
│   └── setup-local-hostname.js   # Local hostname setup
├── docs/                         # Documentation (~67 docs)
├── public/                       # Static assets
├── messages/                     # i18n message files
└── assets/                       # Design assets (HTML templates)
```

## Locked Files - Explicit Approval Required

These files require EXPLICIT approval before ANY change:

- `src/app/layout.tsx` - Root layout
- `src/middleware.ts` - Next.js middleware (i18n + security headers)
- `src/lib/supabase/client.ts` - Supabase browser client
- `next.config.js` - Next.js configuration (Sentry, i18n, webpack)
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
npm run test:watch       # Jest watch mode
npm run test:coverage    # Coverage report

# Backend (in /backend directory)
cd backend && npm start  # Start backend server
cd backend && npm run dev # Start with nodemon (hot reload)

# Validation & Safety
npm run backup:full      # Create full backup
npm run restore:last     # Restore from backup
npm run validate:pre     # Pre-change validation
npm run validate:post    # Post-change validation
npm run validate:full    # Full validation
npm run validate:daily   # Daily validation
npm run preflight        # Pre-deployment check (alias for validate:full)

# Utility
npm run setup:hostname   # Setup local hostname
npm run log:new          # Create new daily log
npm run log:check        # Check daily log
npm run log:update       # Update daily log
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=              # For server-side admin operations

# Mapbox (Required for maps)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_MAPBOX_SLTR_STYLE=mapbox://styles/sltr/cmhum4i1k001x01rlasmoccvm

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=            # Backend socket URL

# Sentry (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token

# Backend specific (in backend/.env)
GROQ_API_KEY=                      # For EROS AI
STRIPE_SECRET_KEY=                 # For payments
```

## Key Features & Components

### 1. Authentication
- Supabase Auth with email/password
- Session management via middleware
- Password reset flow
- Email verification
- Files: `src/app/login/`, `src/app/signup/`, `src/app/forgot-password/`, `src/middleware.ts`

### 2. User Grid/Map Views
- Grid view: `src/components/GridView.tsx`, `GridViewProduction.tsx`
- Map view: `src/components/MapViewSimple.tsx`
- Holo map: `src/app/holo-map/page.tsx`
- Stores: `src/stores/useGridStore.ts`, `useMapStore.ts`
- Hooks: `src/hooks/useMapRealtime.ts`

### 3. Messaging
- Real-time chat via Supabase Realtime
- Files: `src/app/messages/`, `src/hooks/useChatRealtime.ts`, `src/hooks/useUniversalChat.ts`
- Components: `src/components/MessagingModal.tsx`, `ChatSidebar.tsx`
- Backend Socket.io for additional features

### 4. Video Calls
- LiveKit and Daily.co integration
- Components: `src/components/VideoCall.tsx`, `ConferenceRoom.tsx`, `ParticipantTile.tsx`
- Store: `src/stores/useLiveKitStore.ts`
- Hook: `src/hooks/useLiveKitRoom.ts`
- API: `src/app/api/livekit-token/`, `src/app/api/daily/`

### 5. EROS AI System
- Behavior-based matching using Groq (Llama 3.3 70B)
- Analyzes: favorites, calls, blocks, views, messages
- API: `src/lib/eros-api.ts`
- Components: `src/components/ErosAI.tsx`, `ErosFloatingButton.tsx`, `ErosMatchFinder.tsx`, `ErosProfileOptimizer.tsx`, `ErosDailyMatchesStrip.tsx`, `ErosOnboardingModal.tsx`, `ErosAssistantButton.tsx`
- Backend services: `backend/services/analyzer.js`, `matcher.js`, `scheduler.js`

### 6. Subscription Tiers
- Free, Member, Founder, Black Card tiers
- Stripe integration for payments
- Files: `src/lib/privileges/` (config, checker, middleware, cache, types)
- Hooks: `src/hooks/usePrivileges.ts`, `useUsageLimits.ts`, `useSubscription.ts`
- Pages: `src/app/pricing/`, `src/app/sltr-plus/`, `src/app/checkout/`, `src/app/founders-circle/`

### 7. Real-time Features
- Supabase Realtime for presence/updates
- Socket.io backend for messaging
- Hooks: `src/hooks/useRealtime.ts`, `usePresence.ts`, `usePresenceSubscription.ts`
- Manager: `src/lib/realtime/RealtimeManager.ts`
- Store: `src/stores/usePresenceStore.ts`

### 8. Groups & Channels
- Group chat functionality
- Channel-based communication
- Pages: `src/app/groups/`, `src/app/channels/`
- Hook: `src/hooks/useGroupRealtime.ts`
- API: `src/app/api/groups/`

### 9. Black Cards
- Premium membership cards with QR codes
- Admin management
- Pages: `src/app/black-card/[cardNumber]/`, `src/app/admin/black-cards/`
- Component: `src/components/BlackCardGenerator.tsx`, `DynamicFounderCard.tsx`, `FounderCard.tsx`

### 10. User Interactions
- Taps (likes/interests)
- Favorites
- Profile views
- Blocking
- Pages: `src/app/taps/`, `src/app/viewed/`, `src/app/blocked-users/`
- API: `src/app/api/taps/`

## State Management (Zustand)

```typescript
// Available stores in src/stores/
import { useGridStore } from '@/stores/useGridStore'     // Grid view state, filters, nearby users
import { useMapStore } from '@/stores/useMapStore'       // Map view state, location, markers
import { useUIStore } from '@/stores/useUIStore'         // UI state, modals, navigation, theme
import { useUserStore } from '@/stores/useUserStore'     // Current user data, profile
import { useLiveKitStore } from '@/stores/useLiveKitStore' // Video call state, room, participants
import { usePresenceStore } from '@/stores/usePresenceStore' // Online presence, status
```

## API Routes Structure

```
/api/
├── create-checkout-session/      # Stripe checkout session creation
├── daily/
│   └── create-room/              # Daily.co video room creation
├── delete-account/               # Account deletion
├── emails/
│   ├── auth-verification/        # Auth verification emails
│   ├── password-reset/           # Password reset emails
│   └── welcome/                  # Welcome emails
├── feedback/
│   └── welcome/                  # Welcome feedback
├── groups/
│   └── setup-club/               # Club/group setup
├── livekit-token/                # LiveKit video call tokens
├── mapbox-token/                 # Mapbox token endpoint
├── sentry-example-api/           # Sentry test endpoint
├── stripe/
│   ├── route.ts                  # Main Stripe endpoint
│   └── checkout/                 # Checkout handling
├── taps/                         # User tap interactions
├── validate/                     # Validation endpoints
├── validate-simple/              # Simple validation
├── venues/
│   ├── lgbtq/                    # LGBTQ venue search
│   └── search/                   # Venue search
├── verify/
│   └── [code]/
│       ├── route.ts              # Code verification
│       └── redeem/               # Code redemption
└── webhooks/
    ├── stripe/                   # Stripe webhooks
    └── supabase/                 # Supabase webhooks
```

## Database (Supabase)

### Key Tables
- `profiles` - User profiles with location, preferences, subscription tier
- `messages` / `conversations` - Messaging system
- `favorites` - User favorites
- `blocks` / `blocked_users` - Block list
- `taps` - User interactions (likes)
- `groups` - Group chats
- `channels` - Communication channels
- `black_cards` / `founder_black_cards` - Premium membership cards
- `profile_views` - Who viewed profiles
- `push_subscriptions` - Push notification subscriptions
- `settings` - User settings
- `safety_reports` - Safety/report system

### Important Notes
- RLS (Row Level Security) is enabled on all tables
- Migrations in `supabase/migrations/` (25+ migrations)
- Use service key for admin operations only
- Geo-spatial queries via `get_nearby_profiles` function

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Target: ES2020
- strictNullChecks and noUncheckedIndexedAccess enabled

## Internationalization

Supported locales: `en`, `es`, `vi`, `fr`, `pt`, `zh`

```typescript
// src/i18n/config.ts
export const locales = ['en', 'es', 'vi', 'fr', 'pt', 'zh'] as const
export const defaultLocale = 'en'
```

Config: `src/i18n/config.ts`
Messages: `messages/` directory
Middleware: Uses `next-intl` with `localePrefix: 'as-needed'`

## Testing

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

Jest 30.2.0 with React Testing Library configured.

## Deployment

### Frontend (Vercel)
- Auto-deploys from main branch
- Config: `vercel.json`
- Standalone output mode enabled
- Sentry integration (when env vars present)

### Backend (Railway)
- Config: `backend/railway.json`, `backend/Procfile`
- Node.js 22.x runtime
- Socket.io with Redis adapter support

### Docker
- `docker-compose.yml` for local development
- `Dockerfile` for containerized deployment
- `output: 'standalone'` in next.config.js

## Common Tasks

### Adding a New Page
1. Create directory in `src/app/[page-name]/`
2. Add `page.tsx` with component
3. Follow existing patterns for layout
4. Add to navigation if needed (BottomNav, UserMenu)

### Adding a New Component
1. Create in `src/components/`
2. Use TypeScript interfaces for props
3. Follow existing naming conventions (PascalCase)
4. Consider lazy loading for heavy components

### Adding a New API Route
1. Create directory in `src/app/api/[route-name]/`
2. Add `route.ts` with handlers (GET, POST, etc.)
3. Use Supabase client from `@/lib/supabase/server`
4. Add rate limiting if needed

### Adding a New Hook
1. Create in `src/hooks/`
2. Name with `use` prefix
3. Include TypeScript types
4. Handle cleanup in useEffect

### Modifying Database
1. Create migration in `supabase/migrations/`
2. Name format: `YYYYMMDD_description.sql`
3. Test locally before applying
4. Update RLS policies if needed

## Troubleshooting

### Build Fails
```bash
npm run build          # Check for TypeScript errors
npx tsc --noEmit       # Type check only
npm run lint           # Check ESLint issues
```

### Supabase Connection Issues
- Verify environment variables are set
- Check RLS policies in Supabase dashboard
- Review `src/lib/supabase/client.ts`
- Check network connectivity to Supabase

### Real-time Not Working
- Check Supabase Realtime is enabled in dashboard
- Verify subscription channels match table names
- Check backend Socket.io connection
- Review `src/lib/realtime/RealtimeManager.ts`

### Video Calls Not Working
- Verify LiveKit/Daily.co API keys
- Check token generation in API routes
- Review browser permissions for camera/microphone
- Check HTTPS requirement for WebRTC

## Documentation References

- `docs/ENVIRONMENT-SETUP.md` - Environment setup guide
- `docs/CURRENT_WORKING_STATE.md` - Feature status tracking
- `docs/EROS.md` - EROS AI documentation
- `docs/PRIVILEGES.md` - Subscription privileges guide
- `docs/DEPLOYMENT.md` - Deployment instructions
- `docs/TESTING_GUIDE.md` - Testing documentation
- `docs/SAFETY_SYSTEM_GUIDE.md` - Safety features
- `docs/BLACK_CARD_README.md` - Black card system

## Contact & Resources

- Production: https://getsltr.com
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Railway Dashboard: https://railway.app/dashboard

---

**Remember: Stability > Features. Working code > Perfect code. Always backup first.**
