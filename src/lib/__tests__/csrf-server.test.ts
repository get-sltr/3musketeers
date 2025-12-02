/**
 * Tests for CSRF Server-Side Validation
 */

// Mock next/headers
const mockCookieGet = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({
    get: mockCookieGet
  }))
}))

// Mock next/server with NextResponse.json
const mockNextResponseJson = jest.fn((body: unknown, init?: { status?: number }) => ({
  status: init?.status || 200,
  json: async () => body
}))

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => mockNextResponseJson(body, init),
    next: jest.fn(() => ({ status: 200 }))
  }
}))

import {
  validateCSRFToken,
  requireCSRFToken,
  withCSRFProtection,
  validateCSRFForMiddleware
} from '../csrf-server'

describe('csrf-server', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Helper to create mock NextRequest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createMockRequest(options: {
    method?: string
    headers?: Record<string, string>
    pathname?: string
  } = {}): any {
    const { method = 'GET', headers = {}, pathname = '/api/test' } = options

    return {
      method,
      headers: {
        get: (name: string) => headers[name] || null
      },
      nextUrl: {
        pathname
      }
    }
  }

  describe('validateCSRFToken', () => {
    it('should return false when header token is missing', async () => {
      const request = createMockRequest({ method: 'POST' })

      const result = await validateCSRFToken(request)

      expect(result).toBe(false)
    })

    it('should return false when cookie token is missing', async () => {
      mockCookieGet.mockReturnValue(undefined)
      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': 'test-token' }
      })

      const result = await validateCSRFToken(request)

      expect(result).toBe(false)
    })

    it('should return false when tokens do not match', async () => {
      mockCookieGet.mockReturnValue({ value: 'cookie-token' })
      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': 'different-token' }
      })

      const result = await validateCSRFToken(request)

      expect(result).toBe(false)
    })

    it('should return true when tokens match', async () => {
      mockCookieGet.mockReturnValue({ value: 'matching-token' })
      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': 'matching-token' }
      })

      const result = await validateCSRFToken(request)

      expect(result).toBe(true)
    })
  })

  describe('requireCSRFToken', () => {
    it('should return 403 response when token is invalid', async () => {
      mockCookieGet.mockReturnValue(undefined)
      const request = createMockRequest({ method: 'POST' })

      const response = await requireCSRFToken(request)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(403)
    })

    it('should return null when token is valid', async () => {
      mockCookieGet.mockReturnValue({ value: 'valid-token' })
      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': 'valid-token' }
      })

      const response = await requireCSRFToken(request)

      expect(response).toBeNull()
    })
  })

  describe('withCSRFProtection', () => {
    const mockHandler = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true })
    })

    beforeEach(() => {
      mockHandler.mockClear()
    })

    it('should skip CSRF check for GET requests', async () => {
      const request = createMockRequest({ method: 'GET' })
      const wrappedHandler = withCSRFProtection(mockHandler)

      await wrappedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request)
    })

    it('should skip CSRF check for HEAD requests', async () => {
      const request = createMockRequest({ method: 'HEAD' })
      const wrappedHandler = withCSRFProtection(mockHandler)

      await wrappedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request)
    })

    it('should return 403 for POST without valid token', async () => {
      mockCookieGet.mockReturnValue(undefined)
      const request = createMockRequest({ method: 'POST' })
      const wrappedHandler = withCSRFProtection(mockHandler)

      const response = await wrappedHandler(request)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(response.status).toBe(403)
    })

    it('should call handler for POST with valid token', async () => {
      mockCookieGet.mockReturnValue({ value: 'valid-token' })
      const request = createMockRequest({
        method: 'POST',
        headers: { 'X-CSRF-Token': 'valid-token' }
      })
      const wrappedHandler = withCSRFProtection(mockHandler)

      await wrappedHandler(request)

      expect(mockHandler).toHaveBeenCalledWith(request)
    })
  })

  describe('validateCSRFForMiddleware', () => {
    it('should skip validation for GET requests', async () => {
      const request = createMockRequest({ method: 'GET' })

      const response = await validateCSRFForMiddleware(request)

      expect(response).toBeNull()
    })

    it('should skip validation for HEAD requests', async () => {
      const request = createMockRequest({ method: 'HEAD' })

      const response = await validateCSRFForMiddleware(request)

      expect(response).toBeNull()
    })

    it('should skip validation for OPTIONS requests', async () => {
      const request = createMockRequest({ method: 'OPTIONS' })

      const response = await validateCSRFForMiddleware(request)

      expect(response).toBeNull()
    })

    it('should skip validation for webhook endpoints', async () => {
      const request = createMockRequest({
        method: 'POST',
        pathname: '/api/webhooks/stripe'
      })

      const response = await validateCSRFForMiddleware(request)

      expect(response).toBeNull()
    })

    it('should return 403 for POST without valid token', async () => {
      mockCookieGet.mockReturnValue(undefined)
      const request = createMockRequest({
        method: 'POST',
        pathname: '/api/create-checkout-session'
      })

      const response = await validateCSRFForMiddleware(request)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(403)
    })

    it('should return 403 for PUT without valid token', async () => {
      mockCookieGet.mockReturnValue(undefined)
      const request = createMockRequest({
        method: 'PUT',
        pathname: '/api/update-profile'
      })

      const response = await validateCSRFForMiddleware(request)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(403)
    })

    it('should return 403 for DELETE without valid token', async () => {
      mockCookieGet.mockReturnValue(undefined)
      const request = createMockRequest({
        method: 'DELETE',
        pathname: '/api/delete-account'
      })

      const response = await validateCSRFForMiddleware(request)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(403)
    })

    it('should return 403 for PATCH without valid token', async () => {
      mockCookieGet.mockReturnValue(undefined)
      const request = createMockRequest({
        method: 'PATCH',
        pathname: '/api/update-settings'
      })

      const response = await validateCSRFForMiddleware(request)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(403)
    })

    it('should return null for POST with valid token', async () => {
      mockCookieGet.mockReturnValue({ value: 'valid-token' })
      const request = createMockRequest({
        method: 'POST',
        pathname: '/api/create-checkout-session',
        headers: { 'X-CSRF-Token': 'valid-token' }
      })

      const response = await validateCSRFForMiddleware(request)

      expect(response).toBeNull()
    })
  })
})
