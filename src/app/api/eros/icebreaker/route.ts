import { NextRequest, NextResponse } from 'next/server';
import { getIcebreaker } from '@/lib/eros-deep-learning';

export async function POST(request: NextRequest) {
  try {
    const { profile } = await request.json();
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile data required' },
        { status: 400 }
      );
    }

    // Generate icebreaker with caching
    const icebreaker = await getIcebreaker(profile);

    return NextResponse.json({ 
      success: true, 
      icebreaker 
    });
  } catch (error: any) {
    console.error('EROS Icebreaker Error:', error);
    return NextResponse.json(
      { error: error.message || 'Icebreaker generation failed' },
      { status: 500 }
    );
  }
}












