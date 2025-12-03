import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { validateCSRFForMiddleware } from './lib/csrf-server';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export async function middleware(request: NextRequest) {
  // Handle API routes with CSRF validation
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Validate CSRF token for state-changing requests
    const csrfError = await validateCSRFForMiddleware(request);
    if (csrfError) {
      return csrfError;
    }
    return NextResponse.next();
  }

  // Handle i18n routing
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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
