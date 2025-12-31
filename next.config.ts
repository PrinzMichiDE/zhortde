import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // ===========================
  // 🔒 SECURITY CONFIGURATION
  // ===========================
  
  // Enable strict mode for better React development
  reactStrictMode: true,
  
  // Disable x-powered-by header to hide Next.js usage
  poweredByHeader: false,
  
  // Security headers applied at build time
  headers: async () => [
    {
      // Apply to all routes
      source: '/:path*',
      headers: [
        // Prevent clickjacking
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        // Prevent MIME type sniffing
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        // Control referrer information
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        // HTTPS enforcement
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        // Restrict permissions/features
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        },
      ],
    },
    // Prevent caching for sensitive/authenticated areas
    {
      source: '/dashboard/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
    {
      source: '/admin/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
    {
      source: '/protected/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
    {
      source: '/login',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
    {
      source: '/register',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
    // API route handlers should not be cached by browsers
    {
      source: '/api/:path*',
      headers: [{ key: 'Cache-Control', value: 'no-store' }],
    },
    // Exception: machine-readable docs can be cached briefly
    {
      source: '/api/openapi.json',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
    },
    // Cache AEO/SEO helper files (they're safe + small)
    {
      source: '/robots.txt',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
    },
    {
      source: '/sitemap.xml',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
    },
    {
      source: '/llms.txt',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
    },
    {
      // Cache static assets aggressively
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      // Cache images
      source: '/:all*(svg|jpg|jpeg|png|gif|webp|ico)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],

  // ===========================
  // ⚡ PERFORMANCE CONFIGURATION
  // ===========================
  
  // Image optimization settings
  images: {
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Optimize images from these domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize image processing time
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    // Disable blur placeholder for faster initial loads
    dangerouslyAllowSVG: false,
    // Content security policy for images
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'recharts',
      'react-syntax-highlighter',
    ],
  },
  
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {
    // Empty config to enable Turbopack without webpack fallback
  },
  
  // Compression is handled by Vercel/hosting, but we can optimize output
  compress: true,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Reduce bundle size by excluding source maps in production
  productionBrowserSourceMaps: false,
  
  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // TypeScript configuration
  typescript: {
    // Allow production builds even with type errors (for CI/CD flexibility)
    // Set to false for stricter builds
    ignoreBuildErrors: false,
  },
  
  // Output configuration
  output: 'standalone',
};

export default withNextIntl(nextConfig);
