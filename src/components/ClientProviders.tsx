'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

interface ClientProvidersProps {
  children: ReactNode
  locale?: string
}

export default function ClientProviders({ children, locale = 'en' }: ClientProvidersProps) {
  const [messages, setMessages] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load messages for the current locale
    import(`../../messages/${locale}.json`)
      .then((module) => {
        setMessages(module.default)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load translations:', error)
        // Fallback to English if locale fails
        import(`../../messages/en.json`)
          .then((module) => {
            setMessages(module.default)
            setLoading(false)
          })
      })
  }, [locale])

  if (loading || !messages) {
    return <>{children}</>
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1f',
            color: '#fff',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#06b6d4',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </NextIntlClientProvider>
  )
}
