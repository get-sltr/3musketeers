# SLTR - Location-Based Social App

## Overview

SLTR ("Rules Don't Apply") is a modern location-based social application designed for adults (18+) to connect with nearby users. The app features real-time messaging, interactive map and grid views of users, safety features including panic buttons and user reporting, and a glassmorphism-based UI design. Built with Next.js 14, TypeScript, and Supabase for authentication and data management, the app emphasizes user privacy and safety while providing an engaging social experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- Next.js 14 with App Router for server-side rendering and client-side navigation
- TypeScript with strict mode enabled for type safety (`strictNullChecks`, `noUncheckedIndexedAccess`)
- Client-side components using `'use client'` directive for interactive features

**UI/UX Design System**
- Tailwind CSS for utility-first styling with custom glassmorphism components
- Custom CSS classes for reusable glass-effect components (`.glass-bubble`, `.glass-card`)
- Gradient-based branding with cyan-to-magenta color scheme (`#00d4ff` to `#ff00ff`)
- Mobile-first responsive design with touch-optimized interfaces
- Animated splash screen with rotating logo and pulsing effects

**State Management**
- React hooks (`useState`, `useEffect`) for local component state
- LocalStorage for client-side persistence of user preferences, blocked users, and reports
- Session management through Supabase authentication state

**View Modes**
- Dual-view system: Grid view (photo gallery) and Map view (geographical)
- Toggle between views from main app interface
- FilterBar component for user filtering (Online, DTFN, Fresh, Age, Distance)

### Backend Architecture

**Authentication System**
- Supabase Authentication with email/password flow
- Age verification during signup (strict 18+ enforcement)
- Password strength validation (8+ chars, uppercase, lowercase, number, special character)
- Server-side session management with SSR support via `@supabase/ssr`

**Data Models** (Currently Mock, Ready for Database Integration)
- User profiles: id, username, age, photos, bio, distance, online status
- Messages: id, senderId, text, timestamp, isSent status
- Conversations: userId, lastMessage, timestamp, unread count
- Reports: reportedUserId, reporterUserId, reason, category, timestamp, status
- BlockedUsers: userId, blockedAt, reason

**Safety & Moderation**
- Report system with categories (harassment, fake, inappropriate, spam, other)
- User blocking functionality with reason tracking
- Panic button feature for emergency exit (clears all data, redirects to Google)
- Community guidelines enforcement

### External Dependencies

**Third-Party Services**
- **Supabase**: Authentication backend, user session management, future database for user profiles, messages, and safety data
- **Mapbox GL JS**: Interactive mapping for location-based user discovery, custom markers for user positions
- **Unsplash**: Currently used for placeholder user profile images (will be replaced with uploaded user photos)

**Key npm Packages**
- `@supabase/supabase-js` & `@supabase/ssr`: Supabase client libraries for auth and SSR
- `mapbox-gl`: Map rendering and geolocation features
- `next`: React framework with App Router
- `react` & `react-dom`: UI library
- `tailwindcss`: Utility-first CSS framework

**Configuration Requirements**
- Environment variables needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Mapbox access token (to be added for production map functionality)
- Development server runs on port 5000 with host 0.0.0.0

**Future Database Integration**
- Safety data (reports, blocks) currently stored in localStorage, designed to migrate to Supabase tables
- Message persistence and real-time updates to be implemented via Supabase Realtime
- User profile data and photos to be stored in Supabase Storage and Database
- Geolocation data for proximity-based user discovery