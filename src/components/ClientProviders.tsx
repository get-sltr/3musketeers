'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode, useState, useEffect } from 'react'

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
    </NextIntlClientProvider>
  )
}
