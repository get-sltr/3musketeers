import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withCSRFProtection } from '@/lib/csrf-server';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const { code } = await params;

  try {
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if code exists and is valid
    const { data: card, error: cardError } = await supabase
      .from('founder_cards')
      .select('*')
      .eq('verification_code', code)
      .eq('is_active', true)
      .single();

    if (cardError || !card) {
      await supabase.from('verification_logs').insert({
        verification_code: code,
        user_id: user.id,
        attempt_type: 'redeem',
        success: false,
        error_message: 'Invalid code',
      });

      return NextResponse.json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Check if already redeemed
    if (card.redeemed) {
      await supabase.from('verification_logs').insert({
        verification_code: code,
        user_id: user.id,
        attempt_type: 'redeem',
        success: false,
        error_message: 'Already redeemed',
      });

      return NextResponse.json({
        success: false,
        message: 'This card has already been redeemed',
      });
    }

    // Mark card as redeemed
    const { error: updateCardError } = await supabase
      .from('founder_cards')
      .update({
        redeemed: true,
        redeemed_at: new Date().toISOString(),
        user_id: user.id,
        redeemed_email: user.email,
      })
      .eq('id', card.id);

    if (updateCardError) {
      throw updateCardError;
    }

    // Update user tier to founder
    const { error: updateUserError } = await supabase
      .from('profiles')
      .update({
        tier: 'founder',
        founder_number: card.founder_number,
        founder_code: code,
        lifetime_access: true,
        founder_joined_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateUserError) {
      console.error('Error updating user profile:', updateUserError);
      // Don't fail the whole redemption if profile update fails
    }

    // Log successful redemption
    await supabase.from('verification_logs').insert({
      verification_code: code,
      user_id: user.id,
      attempt_type: 'redeem',
      success: true,
    });

    // TODO: Send welcome email
    // await sendFounderWelcomeEmail(user.email, card.founder_name, card.founder_number);

    return NextResponse.json({
      success: true,
      message: 'Lifetime access granted! Welcome to the Founder\'s Circle.',
      founderNumber: card.founder_number,
    });
  } catch (error) {
    console.error('Redemption error:', error);

    // Log failed attempt - need fresh supabase client for error logging
    try {
      const logSupabase = await createClient();
      const {
        data: { user },
      } = await logSupabase.auth.getUser();

      if (user) {
        await logSupabase.from('verification_logs').insert({
          verification_code: code,
          user_id: user.id,
          attempt_type: 'redeem',
          success: false,
          error_message: 'Server error',
        });
      }
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { success: false, message: 'Server error during redemption' },
      { status: 500 }
    );
  }
}

// Note: withCSRFProtection doesn't support route params directly
// We need to create a wrapper that handles the params
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const wrappedHandler = withCSRFProtection(
    (req: NextRequest) => handler(req, context)
  );
  return wrappedHandler(request);
}
