import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIdFromRequest } from '../../lib/rateLimit';

// Schema kept small and copy-pasteable for future routes
const RequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid(),
  attachments: z.array(z.string().url()).max(10).optional()
});

export async function POST(request: Request) {
  try {
    // Basic per-client rate limiting
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

    const json = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code
      }));
      return NextResponse.json({ error: 'Invalid request', issues }, { status: 400 });
    }

    const { message, conversationId, attachments } = parsed.data;

    // Echo back validated payload for demo purposes
    return NextResponse.json({ data: { message, conversationId, attachments } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


