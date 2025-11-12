import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ErosAssistiveTouch } from '@/components/ErosAssistiveTouch';
import ClientProviders from '@/components/ClientProviders';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "SLTR",
  description: "Rules Don't Apply",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SLTR',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
      // Add '/favicon.ico' here after you place a real ICO into public/
    ],
    // Add an Apple touch icon when you have a real PNG asset
    // apple: [ { url: '/apple-touch-icon.png', sizes: '180x180' } ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
  viewportFit: 'cover', // Support for notches and safe areas
};

async function getLocale() {
  // Get locale from cookie or default to 'en'
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return cookieStore.get('NEXT_LOCALE')?.value || 'en'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased font-sans touch-pan-y overscroll-none">
        <ClientProviders locale={locale}>
          {children}
          <ErosAssistiveTouch />
        </ClientProviders>
      </body>
    </html>
  );
}
