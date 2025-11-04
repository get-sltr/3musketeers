import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ErosAssistiveTouch } from '@/components/ErosAssistiveTouch';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "SLTR",
  description: "Rules Don't Apply",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased font-sans touch-pan-y overscroll-none">
        {children}
        <ErosAssistiveTouch />
      </body>
    </html>
  );
}
