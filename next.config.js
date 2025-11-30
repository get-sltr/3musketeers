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

  // Enable standalone output for Docker
  output: 'standalone',

  // Prevent trailing slash redirects (fixes Stripe webhook 301/307)
  skipTrailingSlashRedirect: true,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'date-fns'],
    instrumentationHook: true, // Required for Sentry
  },

  // Headers for webhooks
  async headers() {
    return [
      {
        source: '/api/webhooks/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, stripe-signature' },
        ],
      },
    ]
  },
  
  // Configure webpack for path aliases and fallbacks
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Remove console.log in production (keeps console.error and console.warn)
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin' && minimizer.options) {
          minimizer.options.terserOptions = {
            ...minimizer.options.terserOptions,
            compress: {
              ...minimizer.options.terserOptions?.compress,
              pure_funcs: ['console.log', 'console.debug', 'console.info'], // Remove only these
            },
          }
        }
      })
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

// Make sure adding Sentry options is the last code to run before exporting
// Wrap with next-intl first, then Sentry if enabled
const configWithIntl = withNextIntl(nextConfig);

// Sentry configuration - only enable if all required env vars are present
const shouldUseSentry = 
  process.env.NEXT_PUBLIC_SENTRY_DSN && 
  process.env.SENTRY_ORG && 
  process.env.SENTRY_PROJECT;

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true, // Suppress logs in CI
};

module.exports = shouldUseSentry
  ? withSentryConfig(configWithIntl, sentryWebpackPluginOptions)
  : configWithIntl;
