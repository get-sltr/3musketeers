import { createClient } from '@supabase/supabase-js'
import { render } from '@testing-library/react'
import React from 'react'

// Test utilities for mocking Supabase
export const createMockSupabaseClient = () => {
  return {
    auth: {
      signIn: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null
      }),
    })),
  }
}

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  age: 25,
  bio: 'Test bio',
  photos: ['https://example.com/photo1.jpg'],
  location: { lat: 40.7128, lng: -74.0060 },
  isOnline: true,
  createdAt: '2024-01-01T00:00:00Z',
}

// Mock message data
export const mockMessage = {
  id: 'test-message-id',
  senderId: 'test-user-id',
  receiverId: 'other-user-id',
  content: 'Hello, this is a test message',
  timestamp: '2024-01-01T00:00:00Z',
  isRead: false,
}

// Mock conversation data
export const mockConversation = {
  id: 'test-conversation-id',
  participants: ['test-user-id', 'other-user-id'],
  lastMessage: mockMessage,
  unreadCount: 1,
  updatedAt: '2024-01-01T00:00:00Z',
}

// Mock SupabaseProvider
const SupabaseProvider = ({ children, client }: { children: React.ReactNode; client: any }) => {
  return <div data-testid="supabase-provider">{children}</div>
}

// Test helpers
export const renderWithProviders = (component: React.ReactElement, options: any = {}) => {
  const { supabaseClient = createMockSupabaseClient() } = options
  
  return render(component, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <SupabaseProvider client={supabaseClient}>
        {children}
      </SupabaseProvider>
    ),
  })
}

// Mock Socket.io client
export const createMockSocket = () => ({
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn(),
  connected: true,
})

// Mock Leaflet map
export const createMockMap = () => ({
  setView: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getBounds: jest.fn().mockReturnValue({
    getNorth: () => 40.8,
    getSouth: () => 40.6,
    getEast: () => -73.9,
    getWest: () => -74.1,
  }),
})

// Test data factories
export const createTestUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
})

export const createTestMessage = (overrides = {}) => ({
  ...mockMessage,
  ...overrides,
})

export const createTestConversation = (overrides = {}) => ({
  ...mockConversation,
  ...overrides,
})
