import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/env';

/**
 * llms.txt
 * AEO helper file for LLM crawlers and AI agents.
 * Spec: https://llmstxt.org/ (community convention)
 */
export async function GET() {
  const baseUrl = getBaseUrl();

  const body = [
    '# Zhort',
    '',
    'Zhort is a fast, secure, multi-language URL shortener and Pastebin built with Next.js.',
    'It supports short links, analytics, QR codes, API keys, webhooks, and MCP (Model Context Protocol) for AI agents.',
    '',
    '## Primary pages',
    `- Home: ${baseUrl}/`,
    `- API documentation (human): ${baseUrl}/api`,
    `- Privacy policy: ${baseUrl}/datenschutz`,
    `- Create a paste: ${baseUrl}/paste/create`,
    '',
    '## Developer & AI integration',
    `- OpenAPI (machine-readable): ${baseUrl}/api/openapi.json`,
    `- MCP endpoint (SSE + JSON-RPC): ${baseUrl}/api/mcp`,
    '',
    '## Notes for crawlers',
    '- User-generated content exists under /bio/{username} (link-in-bio).',
    '- Short redirects exist under /s/{shortCode}. These are not intended for indexing.',
    '- Paste pages exist under /p/{slug}. These may contain sensitive content and are not intended for indexing.',
    '',
    '## Localization',
    '- Zhort serves content in multiple languages.',
    "- Locale selection is based on the user's NEXT_LOCALE cookie and Accept-Language.",
    '',
    '## Contact / publisher',
    '- Publisher: Michel Fritzsch',
    '- Website: https://www.michelfritzsch.de',
    '',
  ].join('\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Cache, but allow quick updates
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

