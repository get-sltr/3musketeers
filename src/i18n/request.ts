import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from the request (async in next-intl v4 + Next.js 15)
  let locale = await requestLocale
  
  // Validate locale - fallback to default if invalid or missing
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale
  }

  // Safely load messages with fallback
  let messages = {}
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch {
    // Fallback to English if locale file not found
    messages = (await import(`../../messages/en.json`)).default
  }

  return {
    locale,
    messages
  }
})
