so# CURSOR BUILD GUIDE - SLTR PROJECT
**For AI Coding Assistant: Cursor**  
**Human Oversight Required: YES**  
**Security Level: CRITICAL**

---

## ⚠️ CRITICAL RULES - READ FIRST

### BOUNDARY RULES (NEVER BREAK THESE)

**🚫 YOU MUST NOT:**
1. **Make architectural decisions** without human approval
2. **Skip security steps** for speed
3. **Use insecure patterns** (exposed keys, no validation, etc.)
4. **Invent features** not in the spec
5. **Change the design** without permission
6. **Use deprecated libraries** or old patterns
7. **Ignore TypeScript errors** - fix them
8. **Deploy to production** without testing
9. **Commit secrets** to git
10. **Override human design decisions**

**✅ YOU MUST:**
1. **Follow this guide sequentially** - no skipping steps
2. **Ask before making major decisions**
3. **Validate all user inputs**
4. **Use environment variables** for all secrets
5. **Enable TypeScript strict mode**
6. **Write clean, documented code**
7. **Test each feature** before moving on
8. **Show progress** after each step
9. **Explain technical decisions**
10. **Preserve the design vision**

---

## COMMUNICATION PROTOCOL

### After Each Step:
```
✅ COMPLETED: [Step name]
📝 What I did: [Brief explanation]
🧪 Test this: [How human should test]
⏭️  Next: [What comes next]
❓ Questions: [Any decisions needed]
```

### When Stuck:
```
🛑 BLOCKED: [Issue description]
💡 Options: [2-3 possible solutions]
🤔 Recommendation: [Your suggestion with reasoning]
⏸️  AWAITING: Human decision
```

### Before Major Changes:
```
⚠️  APPROVAL NEEDED
📋 Change: [What you want to do]
🎯 Why: [Reasoning]
⚡ Impact: [What this affects]
🔄 Alternative: [Other options]
```

---

## BUILD SEQUENCE (FOLLOW IN ORDER)

---

## WEEK 1: FOUNDATION

### DAY 1: Project Setup

#### Step 1.1: Initialize Next.js Project
```bash
# Run this command
npx create-next-app@latest sltr --typescript --tailwind --app --src-dir --import-alias "@/*"

# Select these options if prompted:
# ✅ TypeScript
# ✅ ESLint
# ✅ Tailwind CSS
# ✅ App Router
# ✅ src/ directory
# ✅ Import alias @/*
```

**Test:** Navigate to project folder, run `npm run dev`, visit http://localhost:3000

---

#### Step 1.2: Install Dependencies
```bash
cd sltr

# Core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install mapbox-gl
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install date-fns

# Dev dependencies
npm install -D @types/mapbox-gl
```

**Test:** Check package.json - all packages should be listed

---

#### Step 1.3: Environment Setup

Create `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ HUMAN ACTION REQUIRED:**
- Human must provide real Supabase credentials
- Human must provide Mapbox token
- Do NOT use placeholder values in production

Create `.env.example` for reference:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.gitignore` additions:
```
# Environment
.env*.local
.env

# Supabase
.supabase/
```

**Test:** Run `npm run dev` - no errors about missing env vars

---

#### Step 1.4: TypeScript Configuration

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Test:** No TypeScript errors when running dev server

---

### DAY 2: Supabase Configuration

#### Step 2.1: Create Supabase Client

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle error (called from Server Component)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle error (called from Server Component)
          }
        },
      },
    }
  )
}
```

**Test:** No import errors, TypeScript happy

---

#### Step 2.2: Database Types

**⚠️ HUMAN ACTION REQUIRED:**
Human must set up Supabase database first, then run:

```bash
# Generate types from Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
```

If Supabase CLI not set up, human provides database schema, and you create types manually.

---

#### Step 2.3: Authentication Helpers

Create `src/lib/auth/session.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
```

**Test:** Functions compile without errors

---

### DAY 3: Authentication UI

#### Step 3.1: Login Page

Create `src/app/login/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/app')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">SLTR</h1>
          <p className="text-gray-400 mt-2">Rules Don't Apply</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          Don't have an account?{' '}
          <a href="/signup" className="text-white hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  )
}
```

**Test:** 
- Visit http://localhost:3000/login
- See login form
- Try logging in (will fail if no database set up yet)

---

#### Step 3.2: Signup Page

Create `src/app/signup/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    // Create account
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
    } else {
      // Check if email confirmation required
      if (data.user && !data.session) {
        setError('Please check your email to confirm your account')
      } else {
        router.push('/onboarding')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">SLTR</h1>
          <p className="text-gray-400 mt-2">Rules Don't Apply</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
          />

          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            required
            minLength={8}
          />

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-white hover:underline">
            Login
          </a>
        </p>

        <p className="text-center text-gray-500 text-xs mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
```

**Test:** Visit /signup, fill form, submit (database must be set up)

---

### DAY 4-5: Protected Routes & Middleware

#### Step 4.1: Middleware for Auth

Create `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /app routes
  if (request.nextUrl.pathname.startsWith('/app') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users from auth pages
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Test:** 
- Try accessing /app without login → redirects to /login
- Login → can access /app
- Try going to /login when logged in → redirects to /app

---

## WEEK 2: CORE FEATURES

### Step 5: Map View (Mapbox Integration)

**⚠️ APPROVAL NEEDED BEFORE STARTING:**
This is complex. Human should review approach first.

Create `src/components/Map/MapView.tsx`:
```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

interface MapViewProps {
  users: Array<{
    id: string
    username: string
    photo: string
    latitude: number
    longitude: number
    isDTFN: boolean
  }>
  onMarkerClick: (userId: string) => void
}

export default function MapView({ users, onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-118.2437, 34.0522], // Los Angeles
      zoom: 12,
    })

    // Add user location control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    )

    return () => {
      map.current?.remove()
    }
  }, [])

  // Update markers when users change
  useEffect(() => {
    if (!map.current) return

    // Remove old markers
    markers.current.forEach(marker => marker.remove())
    markers.current = []

    // Add new markers
    users.forEach(user => {
      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'user-marker'
      el.style.backgroundImage = `url(${user.photo})`
      el.style.width = '50px'
      el.style.height = '50px'
      el.style.borderRadius = '50%'
      el.style.border = user.isDTFN ? '3px solid red' : '3px solid white'
      el.style.cursor = 'pointer'
      el.style.backgroundSize = 'cover'
      el.style.backgroundPosition = 'center'

      if (user.isDTFN) {
        el.classList.add('dtfn-pulse')
      }

      el.addEventListener('click', () => {
        onMarkerClick(user.id)
      })

      const marker = new mapboxgl.Marker(el)
        .setLngLat([user.longitude, user.latitude])
        .addTo(map.current!)

      markers.current.push(marker)
    })
  }, [users, onMarkerClick])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
          }
        }

        .dtfn-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  )
}
```

**Test:**
- Map renders
- User markers appear
- Click marker triggers callback
- DTFN markers pulse

---

### Step 6: Grid View

Create `src/components/Grid/GridView.tsx`:
```typescript
'use client'

interface User {
  id: string
  username: string
  age: number
  primaryPhoto: string
  distance: number
  isOnline: boolean
  isDTFN: boolean
  isFresh: boolean
}

interface GridViewProps {
  users: User[]
  onUserClick: (userId: string) => void
}

export default function GridView({ users, onUserClick }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {users.map(user => (
        <div
          key={user.id}
          onClick={() => onUserClick(user.id)}
          className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
        >
          {/* Photo */}
          <img
            src={user.primaryPhoto}
            alt={user.username}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* User info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-lg">
                {user.username}
              </h3>
              <span className="text-white/80 text-lg">{user.age}</span>
            </div>
            <div className="text-white/70 text-sm">
              {user.distance < 1 
                ? `${Math.round(user.distance * 5280)} ft away`
                : `${user.distance.toFixed(1)} mi away`}
            </div>
          </div>

          {/* Status indicators */}
          <div className="absolute top-4 right-4 flex gap-2">
            {user.isOnline && (
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            )}
            {user.isDTFN && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
            {user.isFresh && (
              <span className="text-lg">🔥</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Test:**
- Grid displays correctly
- 3 columns on desktop
- User cards clickable
- Status indicators show

---

## WEEK 3: MESSAGING & PROFILES

[Continues with detailed steps for messaging system, profile modals, etc.]

---

## WEEK 4: POLISH & DEPLOYMENT

[Continues with optimization, testing, deployment steps]

---

## TROUBLESHOOTING

### Common Issues

**"Module not found" errors:**
- Check imports use `@/` alias correctly
- Verify file exists in src/ directory
- Restart dev server

**TypeScript errors:**
- Don't ignore them - fix them
- Check database types are generated
- Verify environment variables exist

**Supabase connection fails:**
- Verify .env.local has correct credentials
- Check Supabase project is active
- Verify RLS policies allow access

**Map doesn't load:**
- Check Mapbox token is valid
- Verify token is in .env.local
- Check browser console for errors

---

## CHECKPOINTS

After each major section, stop and report:

```
✅ CHECKPOINT: [Section name]

Completed:
- [List what's done]

Tested:
- [What was tested]
- [Results]

Issues:
- [Any problems encountered]
- [How they were resolved]

Next Steps:
- [What comes next]

Human Review Needed:
- [Anything that needs approval]
```

---

## REMEMBER

1. **Security first** - always
2. **Ask before inventing** - human has vision
3. **Test everything** - don't move forward with broken code
4. **Document decisions** - explain your choices
5. **Preserve the design** - it's not negotiable
6. **Be honest** - if stuck, say so
7. **Stay sequential** - don't skip ahead
8. **Validate inputs** - every single time
9. **Use TypeScript** - properly, not `any` everywhere
10. **Have patience** - building right is better than building fast

**This is not a prototype. This is production. Act accordingly.**

