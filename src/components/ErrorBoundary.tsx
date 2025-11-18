// components/ErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
              <p className="text-gray-400 mb-6">{this.state.error?.message || 'Unknown error'}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-lime-400 text-black px-6 py-3 rounded-full font-bold"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
