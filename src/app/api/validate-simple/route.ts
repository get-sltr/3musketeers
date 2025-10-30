import { NextResponse } from 'next/server';

// Minimal test route without rate limiting
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Dynamic import of zod only
    const { z } = await import('zod');
    
    const RequestSchema = z.object({
      message: z.string().min(1).max(5000),
      conversationId: z.string().uuid(),
      attachments: z.array(z.string().url()).max(10).optional()
    });

    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i: any) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code
      }));
      return NextResponse.json({ error: 'Invalid request', issues }, { status: 400 });
    }

    return NextResponse.json({ data: parsed.data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


