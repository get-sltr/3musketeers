'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-8 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-3xl font-bold gradient-text mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-white/70 mb-6">
              We've been notified about this error and will fix it as soon as possible.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
              >
                Try again
              </button>
              <Link
                href="/app"
                className="px-6 py-3 glass-bubble text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
              >
                Go home
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-left">
                <p className="text-red-400 font-mono text-sm break-all">
                  {error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
