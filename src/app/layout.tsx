import type { Metadata, Viewport } from "next";
import "./globals.css";
import '../styles/SLTRMapPin.css';
import ClientProviders from '@/components/ClientProviders';
import { SkipNavLink } from '@/components/ui/SkipNavLink';

export const metadata: Metadata = {
  title: {
    default: 'SLTR - Connect With People Nearby',
    template: '%s | SLTR',
  },
  description: 'SLTR is a location-based social app to discover and connect with people nearby. Real-time messaging, video calls, and AI-powered matching. Rules don\'t apply.',
  keywords: ['social app', 'dating app', 'meet people nearby', 'location based', 'real-time chat', 'video calls'],
  authors: [{ name: 'SLTR' }],
  creator: 'SLTR',
  publisher: 'SLTR',
  metadataBase: new URL('https://www.getsltr.com'),
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://www.getsltr.com',
    languages: {
      'en': 'https://www.getsltr.com',
      'es': 'https://www.getsltr.com/es',
      'fr': 'https://www.getsltr.com/fr',
      'pt': 'https://www.getsltr.com/pt',
      'vi': 'https://www.getsltr.com/vi',
      'zh': 'https://www.getsltr.com/zh',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'SLTR - Connect With People Nearby',
    description: 'Discover and connect with people nearby. Real-time messaging, video calls, and AI-powered matching.',
    url: 'https://www.getsltr.com',
    siteName: 'SLTR',
    images: [
      {
        url: 'https://opengraph.b-cdn.net/production/images/73a42f99-c28c-41f2-8c7f-dfd9b945287d.png?token=O4JDmAwYLCiwSk5rRY90SGWM0wqmPzhF2bskIYofhMc&height=722&width=1200&expires=33299560831',
        width: 1200,
        height: 722,
        alt: 'SLTR - Connect With People Nearby',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SLTR - Connect With People Nearby',
    description: 'Discover and connect with people nearby. Real-time messaging, video calls, and AI-powered matching.',
    images: ['https://opengraph.b-cdn.net/production/images/73a42f99-c28c-41f2-8c7f-dfd9b945287d.png?token=O4JDmAwYLCiwSk5rRY90SGWM0wqmPzhF2bskIYofhMc&height=722&width=1200&expires=33299560831'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SLTR',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />

        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://bnzyzkmixfmylviaojbj.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <link rel="dns-prefetch" href="https://bnzyzkmixfmylviaojbj.supabase.co" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Mapbox resources - deferred to not block initial render */}
        <link 
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" 
          rel="stylesheet"
          fetchPriority="low"
        />
        <script 
          src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
          async
          defer
        />
      </head>
      <body className="antialiased font-sans touch-pan-y overscroll-none">
        {/* Skip Navigation Link - Accessibility */}
        <SkipNavLink />

        <ClientProviders locale={locale}>
          {/* Wrap children in main content container for skip nav target */}
          <div id="main-content" role="main" tabIndex={-1} className="outline-none">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
