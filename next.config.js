const { withSentryConfig } = require("@sentry/nextjs");
const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds to allow warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Force clean build
  cleanDistDir: true,
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['react-leaflet', 'leaflet'],
    instrumentationHook: false, // Temporarily disabled for dev
  },
  
  // Configure webpack for Leaflet and path aliases
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Silence known noisy warnings from OTEL/Prisma/Sentry server instrumentation
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /@prisma[\\/\\-]instrumentation[\\/].*instrumentation\.js/, message: /Critical dependency/ },
      { module: /require-in-the-middle/, message: /Critical dependency/ },
      { module: /@opentelemetry[\\/\\-]instrumentation/, message: /Critical dependency/ },
    ]
    
    // Explicitly configure path aliases for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }
    
    return config
  },
  
  // Configure images for external domains
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'bnzyzkmixfmylviaojbj.supabase.co'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

// Sentry configuration - only enable if all required env vars are present
const shouldUseSentry = 
  process.env.NEXT_PUBLIC_SENTRY_DSN && 
  process.env.SENTRY_ORG && 
  process.env.SENTRY_PROJECT;

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  
  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,
  
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: "/monitoring",
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  
  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
  
  // Suppress warnings about missing source map references
  errorHandler: (err, invokeErr, compilation) => {
    // Ignore source map warnings - they're not critical
    if (err && err.message && err.message.includes('source map reference')) {
      return;
    }
    // Log other errors
    if (err) {
      console.warn('Sentry webpack plugin warning:', err.message || err);
    }
  },
};

// Make sure adding Sentry options is the last code to run before exporting
// Wrap with next-intl first, then Sentry if enabled
const configWithIntl = withNextIntl(nextConfig);

module.exports = shouldUseSentry
  ? withSentryConfig(configWithIntl, sentryWebpackPluginOptions)
  : configWithIntl;
