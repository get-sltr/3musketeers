import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, verificationUrl, name } = await request.json()

    if (!email || !verificationUrl) {
      return NextResponse.json(
        { error: 'Email and verification URL are required' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'SLTR <onboarding@getsltr.com>',
      to: email,
      subject: 'Verify Your SLTR Email Address ✉️',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); color: #ffffff;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.05); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);">
                        <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff;">Verify Your Email ✉️</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="font-size: 18px; line-height: 1.6; margin: 0 0 20px 0; color: #ffffff;">
                          Hey ${name || 'there'}! 👋
                        </p>
                        
                        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.8);">
                          Thanks for signing up for SLTR! To complete your registration and start connecting with amazing people, please verify your email address by clicking the button below:
                        </p>
                        
                        <div style="text-align: center; margin: 40px 0;">
                          <a href="${verificationUrl}" 
                             style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                            Verify Email Address →
                          </a>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; color: rgba(255, 255, 255, 0.6);">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="font-size: 12px; line-height: 1.6; margin: 10px 0 0 0; color: rgba(6, 182, 212, 0.8); word-break: break-all;">
                          ${verificationUrl}
                        </p>
                        
                        <div style="background: rgba(6, 182, 212, 0.1); border-left: 4px solid #06b6d4; padding: 20px; margin: 30px 0; border-radius: 8px;">
                          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.8);">
                            <strong>💡 Tip:</strong> This verification link will expire in 24 hours. If you didn't create an account with SLTR, you can safely ignore this email.
                          </p>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; color: rgba(255, 255, 255, 0.6);">
                          Once verified, you'll be able to:
                        </p>
                        <ul style="margin: 15px 0 0 0; padding-left: 20px; color: rgba(255, 255, 255, 0.8);">
                          <li style="margin: 10px 0;">Complete your profile</li>
                          <li style="margin: 10px 0;">Start matching with people</li>
                          <li style="margin: 10px 0;">Send and receive messages</li>
                        </ul>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; background: rgba(0, 0, 0, 0.2); border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                          © ${new Date().getFullYear()} SLTR. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: rgba(255, 255, 255, 0.5);">
                          Made with ❤️ by The 3 Musketeers
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
    console.error('Auth verification email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

