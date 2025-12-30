import { NextResponse, type NextRequest } from 'next/server';

/**
 * Security Middleware
 * Implements OWASP security best practices:
 * - Security Headers (CSP, X-Frame-Options, etc.)
 * - Rate Limiting at Edge
 * - Request Validation
 * - Bot Detection
 */

// In-memory rate limiting store (for edge runtime)
// In production, consider using Redis or similar distributed store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // max requests per window
const RATE_LIMIT_AUTH_MAX_REQUESTS = 10; // max auth attempts per window

// Security headers configuration
const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS filter in legacy browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // DNS prefetch control
  'X-DNS-Prefetch-Control': 'on',
  
  // Prevent browser from downloading files in wrong context
  'X-Download-Options': 'noopen',
  
  // Restrict permissions/features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Strict Transport Security (HTTPS enforcement)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// Content Security Policy
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://safebrowsing.googleapis.com https://api.ipify.org",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "block-all-mixed-content",
];

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

/**
 * Simple in-memory rate limiting
 */
function checkRateLimit(identifier: string, maxRequests: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!record || record.resetTime < now) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

/**
 * Detect common bot patterns
 */
function detectBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  
  // Block common bad bots (but allow legitimate ones like Googlebot)
  const badBotPatterns = [
    'sqlmap',
    'nikto',
    'nessus',
    'openvas',
    'w3af',
    'acunetix',
    'masscan',
    'zgrab',
    'nuclei',
    'dirbuster',
    'gobuster',
    'wfuzz',
    'hydra',
    'nmap',
  ];
  
  return badBotPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Validate request for suspicious patterns
 */
function validateRequest(request: NextRequest): { valid: boolean; reason?: string } {
  const url = request.nextUrl;
  const pathname = url.pathname;
  
  // Block common attack patterns in URL
  const suspiciousPatterns = [
    /\.\.\//,              // Path traversal
    /<script/i,            // XSS attempt
    /javascript:/i,        // JS injection
    /data:text\/html/i,    // Data URL injection
    /union\s+select/i,     // SQL injection
    /exec\s*\(/i,          // Command injection
    /%00/,                 // Null byte injection
    /\x00/,                // Null byte
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(pathname) || pattern.test(url.search)) {
      return { valid: false, reason: 'Suspicious request pattern detected' };
    }
  }
  
  // Block overly long URLs (potential buffer overflow attempt)
  if (pathname.length > 2048 || url.search.length > 2048) {
    return { valid: false, reason: 'URL too long' };
  }
  
  return { valid: true };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') && !pathname.endsWith('.json')
  ) {
    return NextResponse.next();
  }
  
  // 1. Bot Detection
  if (detectBot(request)) {
    return new NextResponse('Access Denied', { status: 403 });
  }
  
  // 2. Request Validation
  const validation = validateRequest(request);
  if (!validation.valid) {
    console.warn(`[Security] Blocked suspicious request: ${validation.reason} - ${request.url}`);
    return new NextResponse('Bad Request', { status: 400 });
  }
  
  // 3. Rate Limiting
  const clientIp = getClientIp(request);
  const isAuthEndpoint = pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/register';
  const maxRequests = isAuthEndpoint ? RATE_LIMIT_AUTH_MAX_REQUESTS : RATE_LIMIT_MAX_REQUESTS;
  
  const rateLimitKey = isAuthEndpoint ? `auth:${clientIp}` : `api:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, maxRequests);
  
  if (!rateLimit.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
        },
      }
    );
  }
  
  // 4. Create response with security headers
  const response = NextResponse.next();
  
  // Add all security headers
  for (const [header, value] of Object.entries(securityHeaders)) {
    response.headers.set(header, value);
  }
  
  // Add CSP header
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
  
  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
