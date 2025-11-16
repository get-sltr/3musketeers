import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'

/**
 * GET /api/eros/health
 * Check if Eros AI is configured and working
 */
export async function GET() {
  try {
    // 1. Check if API key exists
    const apiKey = process.env.GROQ_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'GROQ_API_KEY not configured',
        configured: false
      }, { status: 503 })
    }

    // 2. Test the API key with a simple request
    const groq = new Groq({ apiKey })
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: 'Say "Eros is ready" in 3 words or less'
      }],
      temperature: 0.5,
      max_tokens: 10
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response from GROQ')
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Eros AI is ready! 🏹',
      configured: true,
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      testResponse: content,
      model: 'llama-3.3-70b-versatile'
    })

  } catch (error: any) {
    console.error('Eros health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Eros AI health check failed',
      configured: !!process.env.GROQ_API_KEY,
      error: {
        type: error.constructor.name,
        status: error.status,
        message: error.message
      }
    }, { status: 500 })
  }
}
