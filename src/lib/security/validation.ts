import { z } from 'zod'

/**
 * Validation schema for Stripe checkout request
 */
export const StripeCheckoutSchema = z.object({
  tier: z.enum(['member', 'founder', 'blackcard']),
})

export type StripeCheckoutInput = z.infer<typeof StripeCheckoutSchema>

/**
 * Validate and sanitize input data
 */
export function validateCheckoutInput(data: unknown): {
  success: boolean
  data?: StripeCheckoutInput
  error?: string
} {
  try {
    const result = StripeCheckoutSchema.safeParse(data)
    
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message).join(', ')
      return {
        success: false,
        error: errors,
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Invalid request format',
    }
  }
}

