import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/env';

export async function GET() {
  const baseUrl = getBaseUrl();

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Zhort API',
      version: '1.0.0',
      description:
        'Public and authenticated endpoints for the Zhort URL shortener (plus MCP for AI agents).',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/v1/shorten': {
        post: {
          operationId: 'shortenPublic',
          summary: 'Shorten a URL (public)',
          description:
            'Creates a new public short link. Input is validated and checked against threat/block lists.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    url: { type: 'string', format: 'uri' },
                    customCode: { type: 'string' },
                    hp: {
                      type: 'string',
                      description:
                        'Honeypot field (leave empty). If set, request is treated as bot.',
                    },
                  },
                  required: ['url'],
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      shortUrl: { type: 'string', format: 'uri' },
                      shortCode: { type: 'string' },
                      originalUrl: { type: 'string', format: 'uri' },
                    },
                    required: ['success', 'shortUrl', 'shortCode', 'originalUrl'],
                  },
                },
              },
            },
            '400': { description: 'Bad Request' },
            '403': { description: 'Forbidden (blocked domain)' },
            '409': { description: 'Conflict (custom code taken)' },
            '500': { description: 'Server Error' },
          },
        },
        get: {
          operationId: 'shortenDocs',
          summary: 'Endpoint documentation (JSON)',
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
      '/api/v1/links': {
        get: {
          operationId: 'listLinks',
          summary: 'List links (API key required)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'OK' },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Server Error' },
          },
        },
        post: {
          operationId: 'createLink',
          summary: 'Create link (API key required)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    longUrl: { type: 'string', format: 'uri' },
                    customCode: { type: 'string' },
                    password: { type: 'string' },
                    expiresIn: {
                      type: 'string',
                      enum: ['1h', '24h', '7d', '30d'],
                    },
                  },
                  required: ['longUrl'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'Created' },
            '400': { description: 'Bad Request' },
            '401': { description: 'Unauthorized' },
            '409': { description: 'Conflict' },
            '500': { description: 'Server Error' },
          },
        },
      },
      '/api/mcp': {
        get: {
          operationId: 'mcpSse',
          summary: 'MCP SSE endpoint',
          description:
            'Establishes an SSE connection and returns an endpoint event with a sessionId.',
          responses: {
            '200': { description: 'SSE stream' },
          },
        },
        post: {
          operationId: 'mcpRpc',
          summary: 'MCP JSON-RPC endpoint',
          description:
            'JSON-RPC 2.0 methods: initialize, tools/list, tools/call. Optional Bearer auth.',
          responses: {
            '200': { description: 'JSON-RPC response' },
            '400': { description: 'Invalid Request' },
            '500': { description: 'Server Error' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'Use: Authorization: Bearer <api_key>',
        },
      },
    },
  } as const;

  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

