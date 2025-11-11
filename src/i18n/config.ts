export const locales = ['en', 'es', 'vi', 'fr', 'pt', 'zh'] as const
export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  vi: 'Tiếng Việt',
  fr: 'Français',
  pt: 'Português',
  zh: '中文'
}

export const defaultLocale: Locale = 'en'
