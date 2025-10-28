'use client'

import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { captureException, captureMessage, addBreadcrumb } from '../../lib/sentry'
import Link from 'next/link'

export default function TestSentryPage() {
  const [testResult, setTestResult] = useState<string>('')

  const testClientError = () => {
    try {
      addBreadcrumb({
        message: 'User clicked test client error button',
        category: 'user-action',
        level: 'info'
      })
      throw new Error('This is a test client-side error from SLTR app')
    } catch (error) {
      captureException(error as Error, {
        test_type: 'client-error',
        user_action: 'button-click'
      })
      setTestResult('✅ Client error sent to Sentry! Check your Sentry dashboard.')
    }
  }

  const testMessage = () => {
    captureMessage('Test message from SLTR app', 'info')
    setTestResult('✅ Message sent to Sentry! Check your Sentry dashboard.')
  }

  const testWarning = () => {
    captureMessage('Test warning message from SLTR app', 'warning')
    setTestResult('⚠️ Warning sent to Sentry! Check your Sentry dashboard.')
  }

  const testBreadcrumb = () => {
    addBreadcrumb({
      message: 'User navigated to test page',
      category: 'navigation',
      level: 'info',
      data: {
        page: '/test-sentry',
        timestamp: new Date().toISOString()
      }
    })
    setTestResult('✅ Breadcrumb added! Trigger an error to see it in context.')
  }

  const testTransaction = () => {
    Sentry.startSpan({ name: 'Test Span', op: 'test' }, () => {
      // Simulate some work
      const start = Date.now()
      while (Date.now() - start < 100) {
        // Busy wait for 100ms
      }
      setTestResult('✅ Span completed! Check Performance in Sentry.')
    })
  }

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/app" className="glass-bubble p-2 hover:bg-white/10 transition-all duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-4xl font-bold gradient-text">Sentry Testing</h1>
        </div>

        {/* Description */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">🧪 Test Sentry Integration</h2>
          <p className="text-white/70 mb-4">
            Use the buttons below to test different Sentry features. Make sure you've configured your
            Sentry DSN in the environment variables.
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${process.env.NEXT_PUBLIC_SENTRY_DSN ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white/80">
              Sentry DSN: {process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Configured' : '❌ Not configured'}
            </span>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={testClientError}
            className="glass-card p-6 hover:bg-white/10 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🐛</span>
              <h3 className="text-xl font-semibold text-white group-hover:gradient-text">
                Test Client Error
              </h3>
            </div>
            <p className="text-white/60">
              Throws a client-side error and captures it with context
            </p>
          </button>

          <button
            onClick={testMessage}
            className="glass-card p-6 hover:bg-white/10 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">💬</span>
              <h3 className="text-xl font-semibold text-white group-hover:gradient-text">
                Test Message
              </h3>
            </div>
            <p className="text-white/60">
              Sends a simple info message to Sentry
            </p>
          </button>

          <button
            onClick={testWarning}
            className="glass-card p-6 hover:bg-white/10 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-xl font-semibold text-white group-hover:gradient-text">
                Test Warning
              </h3>
            </div>
            <p className="text-white/60">
              Sends a warning-level message to Sentry
            </p>
          </button>

          <button
            onClick={testBreadcrumb}
            className="glass-card p-6 hover:bg-white/10 transition-all duration-300 text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🍞</span>
              <h3 className="text-xl font-semibold text-white group-hover:gradient-text">
                Test Breadcrumb
              </h3>
            </div>
            <p className="text-white/60">
              Adds a breadcrumb for better error context
            </p>
          </button>

          <button
            onClick={testTransaction}
            className="glass-card p-6 hover:bg-white/10 transition-all duration-300 text-left group md:col-span-2"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">⚡</span>
              <h3 className="text-xl font-semibold text-white group-hover:gradient-text">
                Test Performance Transaction
              </h3>
            </div>
            <p className="text-white/60">
              Creates a performance transaction for monitoring
            </p>
          </button>
        </div>

        {/* Result Display */}
        {testResult && (
          <div className="glass-card p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Test Result</h3>
                <p className="text-white/80">{testResult}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="glass-card p-6 mt-8 bg-white/5">
          <h3 className="text-xl font-semibold text-white mb-4">📝 Setup Instructions</h3>
          <ol className="space-y-3 text-white/70">
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">1.</span>
              <span>Create a Sentry account at <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">sentry.io</a></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">2.</span>
              <span>Create a new Next.js project in Sentry</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">3.</span>
              <span>Copy your DSN from the project settings</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">4.</span>
              <span>Add the DSN to your <code className="bg-white/10 px-2 py-1 rounded">.env.local</code> file</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">5.</span>
              <span>Restart your development server and test the buttons above</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
