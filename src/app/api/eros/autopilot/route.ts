import { NextRequest, NextResponse } from 'next/server';
import { autoPilotMode } from '@/lib/eros-deep-learning';

export async function POST(request: NextRequest) {
  try {
    const { userId, settings } = await request.json();
    
    if (!userId || !settings) {
      return NextResponse.json(
        { error: 'User ID and settings required' },
        { status: 400 }
      );
    }

    // Verify settings structure
    if (!settings.autoSwipe && !settings.autoMessage && !settings.autoFilter) {
      return NextResponse.json(
        { error: 'At least one auto-pilot feature must be enabled' },
        { status: 400 }
      );
    }

    // Run auto-pilot mode
    await autoPilotMode(userId, settings);

    return NextResponse.json({ success: true, message: 'Auto-pilot mode activated' });
  } catch (error: any) {
    console.error('EROS AutoPilot Error:', error);
    return NextResponse.json(
      { error: error.message || 'Auto-pilot failed' },
      { status: 500 }
    );
  }
}

