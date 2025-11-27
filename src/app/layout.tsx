import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from 'next/font/google';
import "./globals.css";
import '../styles/SLTRMapPin.css';
import ClientProviders from '@/components/ClientProviders';
import NotificationPrompt from '@/components/NotificationPrompt';
import AdminDashboard from '@/components/AdminDashboard';
// import TwoFactorSetup from '@/components/TwoFactorSetup'; // Temporarily disabled - causing login issues

// Optimized font loading - eliminates render-blocking requests
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
  weight: '900',
  preload: true,
});

export const metadata: Metadata = {
  title: "SLTR",
  description: "Rules Don't Apply",
  metadataBase: new URL('https://www.getsltr.com'),
  manifest: '/manifest.json',
  openGraph: {
    title: 'SLTR',
    description: "Rules Don't Apply",
    url: 'https://www.getsltr.com',
    siteName: 'SLTR',
    images: [
      {
        url: 'https://opengraph.b-cdn.net/production/images/73a42f99-c28c-41f2-8c7f-dfd9b945287d.png?token=O4JDmAwYLCiwSk5rRY90SGWM0wqmPzhF2bskIYofhMc&height=722&width=1200&expires=33299560831',
        width: 1200,
        height: 722,
        alt: 'SLTR',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SLTR',
    description: "Rules Don't Apply",
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
    <html lang={locale}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />

        {/* Mapbox GL JS CDN - async to prevent render blocking */}
        <link 
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" 
          rel="stylesheet"
        />
        <script 
          src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"
          async
        />
      </head>
      <body className={`${inter.variable} ${orbitron.variable} antialiased font-sans touch-pan-y overscroll-none`}>
        <ClientProviders locale={locale}>
          {children}
          <NotificationPrompt />
          {/* <TwoFactorSetup /> */}
          <AdminDashboard />
        </ClientProviders>
      </body>
    </html>
  );
}
