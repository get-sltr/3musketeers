import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCSRFProtection } from '@/lib/csrf-server'

// TODO: Standardize to use createClient() from @/lib/supabase/server consistently
async function handler(request: NextRequest) {
  try {
    const { feedback, email } = await request.json()

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Store feedback in database (you can create a feedback table later)
    // For now, we'll just log it
    console.log('Welcome feedback from', user.id, ':', feedback)

    // Optionally send to admin via email or store in database
    // await supabase.from('feedback').insert({
    //   user_id: user.id,
    //   type: 'welcome',
    //   message: feedback,
    //   contact_email: email
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
  }
}

export const POST = withCSRFProtection(handler)
