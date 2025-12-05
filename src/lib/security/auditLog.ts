import { createClient } from '@/lib/supabase/server'
import * as Sentry from '@sentry/nextjs'

export type AuditEventType =
  | 'payment_attempt'
  | 'payment_success'
  | 'payment_failure'
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'duplicate_subscription_attempt'
  | 'authentication_failure'
  | 'suspicious_activity'

export interface AuditLogEntry {
  event_type: AuditEventType
  user_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, unknown>
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failure' | 'blocked'
}

/**
 * Secure audit logging for security events
 * - Logs to database for historical tracking
 * - Sends to Sentry for critical events
 * - Sanitizes sensitive data before logging
 */
export async function logSecurityEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()
    
    // Sanitize metadata to remove sensitive data
    const sanitizedMetadata = sanitizeMetadata(entry.metadata)
    
    // Log to database for audit trail
    const { error } = await supabase.from('security_audit_log').insert({
      event_type: entry.event_type,
      user_id: entry.user_id,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      metadata: sanitizedMetadata,
      severity: entry.severity,
      status: entry.status,
      created_at: new Date().toISOString(),
    })

    if (error) {
      // If DB logging fails, at least log to Sentry
      Sentry.captureException(error, {
        tags: { component: 'audit_log' },
        extra: { event_type: entry.event_type },
      })
    }

    // Send critical events to Sentry for alerting
    if (entry.severity === 'critical' || entry.severity === 'high') {
      Sentry.captureMessage(`Security Event: ${entry.event_type}`, {
        level: entry.severity === 'critical' ? 'error' : 'warning',
        tags: {
          event_type: entry.event_type,
          status: entry.status,
        },
        extra: {
          user_id: entry.user_id,
          ip_address: maskIP(entry.ip_address),
          metadata: sanitizedMetadata,
        },
      })
    }
  } catch (error) {
    // Fail gracefully - don't block the request if logging fails
    Sentry.captureException(error, {
      tags: { component: 'audit_log', critical: 'true' },
    })
  }
}

/**
 * Remove sensitive data from metadata before logging
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {}

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'api_key',
    'credit_card',
    'ssn',
    'auth',
  ]

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase()
    const isSensitive = sensitiveKeys.some((sensitive) =>
      lowerKey.includes(sensitive)
    )

    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Mask IP address for privacy (keep first two octets)
 */
function maskIP(ip?: string): string {
  if (!ip) return 'unknown'
  
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`
  }
  
  // For IPv6, mask the last 64 bits
  if (ip.includes(':')) {
    const ipv6Parts = ip.split(':')
    return ipv6Parts.slice(0, 4).join(':') + ':xxxx:xxxx:xxxx:xxxx'
  }
  
  return 'masked'
}

/**
 * Helper to get client IP from request
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers (in order of preference)
  const headers = [
    'x-real-ip',
    'x-forwarded-for',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-cluster-client-ip',
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // x-forwarded-for can be a comma-separated list
      return value.split(',')[0].trim()
    }
  }

  return 'unknown'
}

