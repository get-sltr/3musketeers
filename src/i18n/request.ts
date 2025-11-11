import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './config'

export default getRequestConfig(async ({ locale }) => {
  const validatedLocale = locale as Locale
  if (!locales.includes(validatedLocale)) notFound()

  return {
    locale: validatedLocale,
    messages: (await import(`../../messages/${validatedLocale}.json`)).default
  }
})
