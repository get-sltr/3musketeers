import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeFavorites, 
  analyzeCallHistory, 
  analyzeBlockPatterns,
  learnUltimatePreferences 
} from '@/lib/eros-deep-learning';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, analysisType } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Verify user is authenticated (using service key for server-side)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // For API routes, verify userId is provided and valid
    // In production, you'd verify the auth token here
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    let result;
    
    switch (analysisType) {
      case 'favorites':
        result = await analyzeFavorites(userId);
        break;
      case 'calls':
        result = await analyzeCallHistory(userId);
        break;
      case 'blocks':
        result = await analyzeBlockPatterns(userId);
        break;
      case 'ultimate':
        result = await learnUltimatePreferences(userId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('EROS Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

