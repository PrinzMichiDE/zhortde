import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          // AEO / docs
          '/llms.txt',
          '/api/openapi.json',
          // Human-facing docs page
          '/api',
        ],
        disallow: [
          '/admin',
          '/dashboard',
          '/protected',
          // Block API route handlers but allow the human docs page at /api
          '/api/',
          // Block user-generated / redirect-heavy content from indexing by default
          '/s/',
          '/p/',
          '/mask/',
          // Next internals
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

