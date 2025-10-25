/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds to allow warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['react-leaflet', 'leaflet']
  },
  
  // Configure webpack for Leaflet
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
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

module.exports = nextConfig;
