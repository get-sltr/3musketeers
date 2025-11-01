# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

Frontend (root):
- Install: npm install
- Dev (port 5000): npm run dev
- Build: npm run build
- Start (production): npm run start
- Lint: npm run lint
- Tests:
  - All: npm test
  - Watch: npm run test:watch
  - Coverage: npm run test:coverage
  - Single file: npm test -- src/path/to/file.test.tsx
  - By name: npm test -- -t "pattern"
- Typecheck: npx tsc --noEmit
- Validation suite: npm run validate:pre | validate:post | validate:full | validate:daily | preflight
- Utilities: npm run log:new | log:check | log:remind | log:update | open:files | backup | restore:last

Backend (backend/):
- Install: cd backend && npm install
- Dev (nodemon): npm run dev
- Start: npm start
- Health check: curl http://localhost:3001/api/health

## Environment
- Node: 22.x (see engines in package.json)
- Frontend: copy .env.example to .env.local (or use frontend-env-template.txt). Important keys: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_DEV_BACKEND_URL.
- Backend: in backend/.env (see backend-env-template.txt). Important keys: SUPABASE_URL, SUPABASE_ANON_KEY, FRONTEND_URL, BACKEND_URL, PORT.
- Do not paste secrets into prompts. Use templates, then run locally.

## Architecture (big picture)
- Framework: Next.js 14 App Router in src/app (layout.tsx, page.tsx, nested routes under app/*, API routes under app/api/*).
- Security headers: src/middleware.ts adds HSTS, X-Frame-Options, etc., applied to all paths.
- Path alias: @/* → src/* (tsconfig.json, next.config.js webpack alias).
- Error monitoring: Sentry configured via sentry.server.config.ts and sentry.edge.config.ts, with registration in src/instrumentation.ts and helper utilities in src/lib/sentry.ts.
- Supabase client: src/lib/supabase/client.ts creates a browser client (warns if placeholders are present). A simpler variant exists at lib/supabase/client.ts.
- Realtime system:
  - Backend service (backend/): Express + Socket.io server (server.js) with CORS, Helmet, rate limiting, file uploads (multer), and Supabase auth verification. Rooms: user_${id} (personal) and conversation_${id}. HTTP endpoints: POST /api/upload, GET /api/health, static /uploads.
  - Socket events (high level): authenticate, send_message, typing_start/typing_stop, mark_message_read, join_conversation/leave_conversation, call_offer/call_answer/call_ice_candidate/call_end, location_update, file_share, plus server-emitted new_message, message_delivered, message_read, user_online/offline, user_location_update, file_shared.
  - Frontend client: src/hooks/useSocket.ts initializes socket.io-client, authenticates using Supabase access token, and dispatches window events for message/presence/call/location updates. Provides helpers for sending messages, typing indicators, joining rooms, read receipts, file sharing, location updates, and WebRTC signaling.
- Maps: Mapbox is integrated (NEXT_PUBLIC_MAPBOX_TOKEN). Map components exist under src/app/components/maps and src/components/* for Mapbox/Leaflet usage.
- Build configuration: next.config.js enables Sentry plugin conditionally, sets image domains, webpack alias, and disables ESLint during builds. Typescript is strict with noEmit.

## Rules (from Cursor)
- Changes require explicit approval from Kevin Minn (Project Owner). Do not alter code without permission. Enforcement: strict. Source: src/app/.cursor/rules/config.json (requireApprovalForChanges=true; owner: Kevin Minn; company: SLTR DIGITAL LLC).
- Before implementing changes, include a clear explanation of the issue, cause, proposed plan, and solution.

## Notes for Warp
- Frontend dev server runs on http://localhost:5000 per package.json.
- The validate scripts may build and typecheck; prefer running validate:pre locally before large edits.
- For local realtime, set NEXT_PUBLIC_DEV_BACKEND_URL=http://localhost:3001 and run the backend dev server.
