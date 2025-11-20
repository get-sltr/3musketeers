import { NextRequest, NextResponse } from 'next/server';
import { predictiveMatch, learnUltimatePreferences } from '@/lib/eros-deep-learning';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId, candidateProfileId } = await request.json();
    
    if (!userId || !candidateProfileId) {
      return NextResponse.json(
        { error: 'User ID and candidate profile ID required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service key for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get ultimate preferences
    const ultimatePattern = await learnUltimatePreferences(userId);
    
    // Get candidate profile
    const { data: candidateProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', candidateProfileId)
      .single();

    if (profileError || !candidateProfile) {
      return NextResponse.json(
        { error: 'Candidate profile not found' },
        { status: 404 }
      );
    }

    // Get prediction
    const prediction = await predictiveMatch(userId, candidateProfile, ultimatePattern);

    return NextResponse.json({ success: true, data: prediction });
  } catch (error: any) {
    console.error('EROS Prediction Error:', error);
    return NextResponse.json(
      { error: error.message || 'Prediction failed' },
      { status: 500 }
    );
  }
}

