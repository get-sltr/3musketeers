import * as Sentry from '@sentry/nextjs';
import type { Metadata } from "next";
import "./globals.css";

export function generateMetadata(): Metadata {
  return {
    title: "SLTR",
    description: "Rules Don't Apply",
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
