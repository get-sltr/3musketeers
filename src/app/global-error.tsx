"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          background: 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💥</div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '16px'
            }}>
              Oops! Something went wrong
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '24px'
            }}>
              We've been notified about this error and will fix it as soon as possible.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #00d4ff, #ff00ff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Try again
              </button>
              <a
                href="/app"
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontSize: '16px',
                  display: 'inline-block'
                }}
              >
                Go home
              </a>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                textAlign: 'left'
              }}>
                <p style={{
                  color: '#f87171',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  margin: 0
                }}>
                  {error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
