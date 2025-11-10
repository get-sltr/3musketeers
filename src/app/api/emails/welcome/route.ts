import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(request: NextRequest) {
  try {
    const { email, name, username } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!resend) {
      console.error('Resend API key is not configured')
      return NextResponse.json(
        { error: 'Email service unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'Kevin @ SLTR <info@getsltr.com>',
      to: email,
      subject: 'What inspired you to join SLTR?',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to SLTR</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0a0a0f; color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

              <!-- Header -->
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-size: 42px; font-weight: 900; letter-spacing: 0.1em; margin: 0; background: linear-gradient(135deg, #00d4ff, #ff00ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">SLTR</h1>
                <p style="color: rgba(255, 255, 255, 0.5); font-size: 14px; margin-top: 8px;">where rules don't apply</p>
              </div>

              <!-- Main Content -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; margin-bottom: 32px;">
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                  Hey${name || username ? ` ${name || username}` : ''}!
                </p>

                <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                  Thanks for being one of the first to join SLTR — where rules don't apply.
                </p>

                <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                  I created SLTR because connection shouldn't feel like a game of swipes and algorithms. It should feel <strong style="color: #00d9ff;">real</strong>. <strong style="color: #00d9ff;">Human</strong>. <strong style="color: #00d9ff;">Effortless</strong>.
                </p>

                <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                  We're building something that learns from real people — not trends, not data. I want to know: <strong style="color: #ff00ff;">what made you say yes to SLTR?</strong>
                </p>

                <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                  Your feedback shapes everything — every feature, every fix, every update. Tell me what matters most, and I'll make sure SLTR delivers exactly that.
                </p>

                <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                  Appreciate you being here from the very start. You're part of the foundation of something new.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                  <a href="mailto:info@getsltr.com?subject=My%20SLTR%20Feedback" style="display: inline-block; background: linear-gradient(135deg, #00d4ff, #ff00ff); color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
                    Share Your Thoughts
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="color: rgba(255, 255, 255, 0.4); font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.1em;">
                  innovation | intelligence | intuitive
                </p>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; margin: 0 0 4px 0;">
                  <strong>Kevin</strong><br />
                  Founder & CEO, SLTR
                </p>
                <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 8px 0 0 0;">
                  📩 <a href="mailto:info@getsltr.com" style="color: #00d9ff; text-decoration: none;">info@getsltr.com</a>
                </p>
                <p style="color: rgba(255, 255, 255, 0.3); font-size: 11px; margin: 16px 0 0 0;">
                  SLTR DIGITAL LLC
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Welcome email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

