import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireCsrf } from './lib/csrf';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API routes with CSRF protection
  if (pathname.startsWith('/api/')) {
    // Check CSRF token for state-changing requests
    const csrfValid = await requireCsrf(request);
    if (!csrfValid) {
      console.error(`CSRF validation failed for ${request.method} ${pathname}`);
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    // CSRF check passed, continue to API handler
    return NextResponse.next();
  }

  // Pass through for page routes (i18n temporarily disabled for Next.js 15 compatibility)
  const response = NextResponse.next();

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
  // Only API routes need middleware now
  matcher: [
    '/api/:path*'
  ]
};
