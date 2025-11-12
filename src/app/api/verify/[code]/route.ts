import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });
  const { code } = params;

  try {
    // Check if code exists and get card details
    const { data: card, error } = await supabase
      .from('founder_cards')
      .select('*')
      .eq('verification_code', code)
      .eq('is_active', true)
      .single();

    if (error || !card) {
      return NextResponse.json({
        valid: false,
        redeemed: false,
        message: 'Invalid verification code',
      });
    }

    // Log verification attempt
    await supabase.from('verification_logs').insert({
      verification_code: code,
      attempt_type: 'check',
      success: true,
    });

    return NextResponse.json({
      valid: true,
      redeemed: card.redeemed,
      founderNumber: card.founder_number,
      founderName: card.founder_name,
      redeemedBy: card.redeemed_email,
      redeemedAt: card.redeemed_at,
      message: card.redeemed ? 'Card already redeemed' : 'Valid card',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { valid: false, redeemed: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
