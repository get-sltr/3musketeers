import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(request: NextRequest) {
  try {
    const { email, resetUrl, name } = await request.json()

    if (!email || !resetUrl) {
      return NextResponse.json(
        { error: 'Email and reset URL are required' },
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
      from: 'SLTR <security@getsltr.com>',
      to: email,
      subject: 'Reset Your SLTR Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0a0a0f; color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #0a0a0f; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.03); border-radius: 20px; border: 1px solid rgba(57, 255, 20, 0.2); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center; background: #111118; border-bottom: 2px solid #39ff14;">
                        <h1 style="margin: 0; font-size: 48px; font-weight: 900; letter-spacing: 0.15em; color: #39ff14; text-shadow: 0 0 20px rgba(57, 255, 20, 0.3);">SLTR</h1>
                        <p style="margin: 16px 0 0 0; font-size: 20px; font-weight: 600; color: #ffffff;">Reset Your Password 🔒</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; color: #ffffff;">
                          Hey ${name || 'there'}! 👋
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; color: rgba(255, 255, 255, 0.85);">
                          We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        
                        <div style="text-align: center; margin: 40px 0;">
                          <a href="${resetUrl}" 
                             style="display: inline-block; background: #39ff14; color: #0a0a0f; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 20px rgba(57, 255, 20, 0.3);">
                            Reset Password →
                          </a>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; color: rgba(255, 255, 255, 0.6);">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="font-size: 12px; line-height: 1.6; margin: 10px 0 0 0; color: #39ff14; word-break: break-all; opacity: 0.8;">
                          ${resetUrl}
                        </p>
                        
                        <div style="background: rgba(255, 100, 100, 0.1); border-left: 4px solid #ff6b6b; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.85);">
                            <strong style="color: #ff6b6b;">⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(57, 255, 20, 0.15);">
                        <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                          © ${new Date().getFullYear()} SLTR DIGITAL LLC. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                          If you have any concerns about your account security, please contact us immediately.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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
    console.error('Password reset email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
