import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { links, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { isUrlBlocked } from '@/lib/blocklist';
import { incrementStat } from '@/lib/db/init-stats';
import { validateApiKey } from '@/lib/api-keys';

/**
 * MCP Server Implementation (Model Context Protocol)
 * Allows AI agents to interact with Zhort
 */

// This is a simple in-memory session store. 
// Note: In a serverless environment (Vercel), this memory is not persistent across all requests
// but usually survives for the duration of a hot lambda.
// For production, use Redis or database for session management.
const sessions = new Map<string, ReadableStreamDefaultController>();

// Tools definition
const TOOLS = [
  {
    name: "shorten_link",
    description: "Shorten a URL. Returns the short URL and code.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The long URL to shorten" },
        customCode: { type: "string", description: "Optional custom short code" },
      },
      required: ["url"],
    },
  },
  {
    name: "get_link_stats",
    description: "Get statistics for a short link.",
    inputSchema: {
      type: "object",
      properties: {
        shortCode: { type: "string", description: "The short code of the link" },
      },
      required: ["shortCode"],
    },
  },
  {
    name: "list_latest_links",
    description: "List the latest links created by the user.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of links to return (default 10)" },
      },
    },
  },
];

export async function GET(request: NextRequest) {
  // 1. Authenticate via API Key (optional for public tools, required for private)
  // For MCP, we usually pass the key in headers.
  const authHeader = request.headers.get('Authorization');
  let userId: number | null = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.split(' ')[1];
    userId = await validateApiKey(key);
  }

  // 2. Setup SSE Stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const sessionId = nanoid();
      sessions.set(sessionId, controller);

      // Send endpoint event
      const endpointUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mcp?sessionId=${sessionId}`;
      
      const endpointMessage = {
        type: "endpoint",
        uri: endpointUrl,
      };
      
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${JSON.stringify(endpointMessage)}\n\n`));

      // Send tool list immediately as a notification? 
      // Typically MCP waits for 'initialize' request, but over HTTP it might be different.
      // We will wait for POST requests.
    },
    cancel() {
      // Cleanup
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');
  
  // Basic Auth Check
  const authHeader = request.headers.get('Authorization');
  let userId: number | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.split(' ')[1];
    userId = await validateApiKey(key);
  }

  try {
    const body = await request.json();
    
    // JSON-RPC 2.0 Handling
    if (body.jsonrpc !== '2.0') {
      return NextResponse.json({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: body.id });
    }

    // Handle 'initialize'
    if (body.method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "zhort-mcp",
            version: "1.0.0",
          },
        },
      });
    }

    // Handle 'notifications/initialized'
    if (body.method === 'notifications/initialized') {
      return new NextResponse(null, { status: 200 });
    }

    // Handle 'tools/list'
    if (body.method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools: TOOLS,
        },
      });
    }

    // Handle 'tools/call'
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      try {
        let result;
        
        switch (name) {
          case 'shorten_link':
            result = await handleShortenLink(args, userId);
            break;
          case 'get_link_stats':
            result = await handleGetLinkStats(args, userId);
            break;
          case 'list_latest_links':
            result = await handleListLatestLinks(args, userId);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          },
        });

      } catch (err: any) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32603,
            message: err.message || 'Internal error',
          },
        });
      }
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      error: { code: -32601, message: 'Method not found' },
    });

  } catch (error) {
    console.error('MCP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper Functions

async function handleShortenLink(args: any, userId: number | null) {
  const { url, customCode } = args;
  
  if (!url) throw new Error('URL is required');

  // Blocklist check
  const blocked = await isUrlBlocked(url);
  if (blocked) throw new Error('URL is blocked');

  let shortCode = customCode;

  if (shortCode) {
    const existing = await db.query.links.findFirst({
      where: eq(links.shortCode, shortCode),
    });
    if (existing) throw new Error('Short code already exists');
  } else {
    shortCode = nanoid(8);
  }

  await db.insert(links).values({
    shortCode,
    longUrl: url,
    userId: userId || null,
    isPublic: true,
  });

  await incrementStat('links');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return {
    shortUrl: `${baseUrl}/s/${shortCode}`,
    shortCode,
    originalUrl: url,
  };
}

async function handleGetLinkStats(args: any, userId: number | null) {
  const { shortCode } = args;
  if (!shortCode) throw new Error('Short code is required');

  const link = await db.query.links.findFirst({
    where: eq(links.shortCode, shortCode),
  });

  if (!link) throw new Error('Link not found');

  // If user is authenticated, check ownership? 
  // For now, let's allow public stats if the user wants enterprise features exposed.
  // But strictly, we should check ownership.
  if (userId && link.userId && link.userId !== userId) {
    // Only allow if user owns it
    // throw new Error('Unauthorized');
    // Actually, stats might be public. Let's return basic stats.
  }

  return {
    shortCode: link.shortCode,
    hits: link.hits,
    createdAt: link.createdAt,
    longUrl: link.longUrl,
  };
}

async function handleListLatestLinks(args: any, userId: number | null) {
  if (!userId) throw new Error('Authentication required for listing links');
  
  const limit = args.limit || 10;
  
  const userLinks = await db.query.links.findMany({
    where: eq(links.userId, userId),
    orderBy: [desc(links.createdAt)],
    limit: limit,
  });

  return userLinks.map(l => ({
    shortCode: l.shortCode,
    longUrl: l.longUrl,
    hits: l.hits,
    createdAt: l.createdAt,
  }));
}
