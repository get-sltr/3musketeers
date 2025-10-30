import { NextResponse } from 'next/server';

// Force dynamic rendering - prevent static analysis during build
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    // Parse request body
    let json: any;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Import zod first
    const { z } = await import('zod');
    
    // Then try rateLimit separately to avoid Promise.all analysis
    let rateLimitModule: any = null;
    try {
      rateLimitModule = await import('../../lib/rateLimit');
    } catch {
      // RateLimit unavailable - continue without it
    }
    
    // Schema created inside function
    const RequestSchema = z.object({
      message: z.string().min(1).max(5000),
      conversationId: z.string().uuid(),
      attachments: z.array(z.string().url()).max(10).optional()
    });

    // Optional rate limiting - now safe from build-time analysis
    if (rateLimitModule) {
      try {
        const { checkRateLimit, getClientIdFromRequest } = rateLimitModule;
        const clientId = getClientIdFromRequest(request);
        const rl = await checkRateLimit(`validate:${clientId}`, 100, 60_000);
        if (!rl.ok) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Remaining': String(rl.remaining),
                'X-RateLimit-Reset': String(rl.resetMs)
              }
            }
          );
        }
      } catch (rateLimitError) {
        // If rate limiting fails, continue without it
        console.error('Rate limit error:', rateLimitError);
      }
    }

    // Validate request
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i: any) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code
      }));
      return NextResponse.json({ error: 'Invalid request', issues }, { status: 400 });
    }

    const { message, conversationId, attachments } = parsed.data;

    return NextResponse.json(
      { data: { message, conversationId, attachments } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Validate route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
