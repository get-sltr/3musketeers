import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeFavorites, 
  analyzeCallHistory, 
  analyzeBlockPatterns,
  learnUltimatePreferences 
} from '@/lib/eros-deep-learning';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Check GROQ API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not configured');
      return NextResponse.json(
        { error: 'Eros AI is not configured. Please add GROQ_API_KEY to environment variables.' },
        { status: 503 }
      );
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Get analysis type from request
    const body = await request.json();
    const { analysisType } = body;
    const userId = body.userId || user.id; // Use authenticated user's ID by default
    
    if (!analysisType) {
      return NextResponse.json(
        { error: 'Missing analysisType. Must be one of: favorites, calls, blocks, ultimate' },
        { status: 400 }
      );
    }

    console.log(`🤖 EROS analyzing ${analysisType} for user ${userId}`);

    // 4. Run analysis
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
        return NextResponse.json(
          { error: `Invalid analysis type: ${analysisType}. Must be one of: favorites, calls, blocks, ultimate` },
          { status: 400 }
        );
    }

    console.log(`✅ EROS ${analysisType} analysis complete`);
    return NextResponse.json({ success: true, data: result });
    
  } catch (error: any) {
    console.error('❌ EROS Analysis Error:', error);
    
    // Better error messages
    let errorMessage = 'Analysis failed';
    let statusCode = 500;
    
    if (error.message?.includes('GROQ_API_KEY')) {
      errorMessage = 'Eros AI configuration error';
      statusCode = 503;
    } else if (error.status === 429 || error.statusCode === 429) {
      errorMessage = 'Eros is thinking too hard. Try again in a moment.';
      statusCode = 429;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}

