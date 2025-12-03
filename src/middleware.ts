import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { requireCsrf } from './lib/csrf';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API routes with CSRF protection
  if (pathname.startsWith('/api/')) {
    // Check CSRF token for state-changing requests
    if (!requireCsrf(request)) {
      console.error(`CSRF validation failed for ${request.method} ${pathname}`);
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    // CSRF check passed, continue to API handler
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
  // Include both page routes and API routes
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)', // Page routes (excluding static files)
    '/api/:path*' // All API routes
  ]
};
