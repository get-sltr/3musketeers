import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { requireCsrf } from './lib/csrf';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes that should skip CSRF protection
  const csrfExemptRoutes = [
    '/api/webhooks', // Stripe webhooks
    '/api/health', // Health checks
    '/api/v1/heartbeat', // EROS heartbeat
    '/api/v1/matches', // EROS matches
    '/api/v1/assistant', // EROS chat
    '/api/v1/activity', // EROS activity
  ];

  // Check if route is exempt from CSRF
  const isExempt = csrfExemptRoutes.some(route => pathname.startsWith(route));

  // Handle API routes with CSRF protection (skip exempt routes)
  if (pathname.startsWith('/api/') && !isExempt) {
    const csrfValid = await requireCsrf(request);
    if (!csrfValid) {
      console.error(`CSRF validation failed for ${request.method} ${pathname}`);
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Handle i18n routing for page routes
  const response = intlMiddleware(request);

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
    '/api/:path*'
  ]
};
