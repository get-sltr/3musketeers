import { NextRequest, NextResponse } from 'next/server';
import { analyzeMatches } from '@/lib/eros-deep-learning';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, matchIds } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json(
        { error: 'Match IDs array required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service key for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all match profiles in one query
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', matchIds)
      .limit(50); // Limit to 50 profiles per batch

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: 'Profiles not found' },
        { status: 404 }
      );
    }

    // Batch analyze all matches at once
    const analyses = await analyzeMatches(profiles);

    return NextResponse.json({ 
      success: true, 
      count: analyses.length,
      analyses 
    });
  } catch (error: any) {
    console.error('EROS Batch Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Batch analysis failed' },
      { status: 500 }
    );
  }
}





