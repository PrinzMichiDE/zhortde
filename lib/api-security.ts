/**
 * API Security Utilities
 * Provides consistent security patterns for all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { z } from 'zod';
import { logSecurityEvent } from './security';

// ===========================
// 🔒 SECURE RESPONSE HELPERS
// ===========================

/**
 * Standard error responses - don't leak internal details
 */
export const ApiErrors = {
  UNAUTHORIZED: { error: 'Unauthorized', status: 401 },
  FORBIDDEN: { error: 'Forbidden', status: 403 },
  NOT_FOUND: { error: 'Not found', status: 404 },
  RATE_LIMITED: { error: 'Too many requests', status: 429 },
  BAD_REQUEST: { error: 'Bad request', status: 400 },
  INTERNAL_ERROR: { error: 'Internal server error', status: 500 },
  VALIDATION_ERROR: (message: string) => ({ error: message, status: 400 }),
} as const;

/**
 * Create a secure error response
 */
export function secureErrorResponse(
  error: { error: string; status: number },
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { error: error.error },
    { 
      status: error.status,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        ...headers,
      },
    }
  );
}

/**
 * Create a secure success response
 */
export function secureResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

// ===========================
// 🔐 AUTHENTICATION HELPERS
// ===========================

export interface AuthenticatedRequest {
  userId: number;
  email: string;
  role: string;
}

/**
 * Require authentication for a route
 */
export async function requireAuth(): Promise<AuthenticatedRequest | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || !session?.user?.email) {
    return null;
  }
  
  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    return null;
  }
  
  return {
    userId,
    email: session.user.email,
    role: session.user.role || 'user',
  };
}

/**
 * Require admin role for a route
 */
export async function requireAdmin(): Promise<AuthenticatedRequest | null> {
  const auth = await requireAuth();
  
  if (!auth) {
    return null;
  }
  
  if (auth.role !== 'admin') {
    logSecurityEvent({
      type: 'permission_denied',
      userId: auth.userId,
      ip: 'server',
      details: { required: 'admin', actual: auth.role },
      timestamp: new Date(),
    });
    return null;
  }
  
  return auth;
}

// ===========================
// 📝 INPUT VALIDATION
// ===========================

/**
 * Validate JSON request body with Zod schema
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
  maxSize: number = 10240 // 10KB default
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { success: false, error: 'Content-Type must be application/json' };
    }
    
    // Read and check body size
    const text = await request.text();
    if (text.length > maxSize) {
      return { success: false, error: 'Request body too large' };
    }
    
    // Parse JSON
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return { success: false, error: 'Invalid JSON body' };
    }
    
    // Validate with Zod
    const result = schema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return { 
        success: false, 
        error: firstIssue?.message || 'Validation failed' 
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Body validation error:', error);
    return { success: false, error: 'Failed to process request' };
  }
}

// ===========================
// 🛡️ COMMON VALIDATION SCHEMAS
// ===========================

/**
 * Paste content validation
 */
export const pasteSchema = z.object({
  content: z
    .string()
    .min(1, 'Inhalt ist erforderlich')
    .max(500000, 'Inhalt ist zu groß (max 500KB)'),
  syntaxHighlightingLanguage: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_-]*$/, 'Ungültige Sprache')
    .optional()
    .nullable(),
  isPublic: z.boolean().default(true),
  password: z.string().max(128).optional(),
  expiresIn: z.enum(['1h', '24h', '7d', '30d', 'never']).optional(),
});

/**
 * Webhook URL validation - must be HTTPS in production
 */
export const webhookSchema = z.object({
  url: z
    .string()
    .url('Ungültige URL')
    .max(500, 'URL ist zu lang')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        // Allow HTTP only in development
        if (process.env.NODE_ENV === 'production') {
          return parsed.protocol === 'https:';
        }
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'Webhook-URL muss HTTPS verwenden'),
  events: z
    .array(z.enum([
      'link.created',
      'link.clicked',
      'link.updated',
      'link.deleted',
    ]))
    .min(1, 'Mindestens ein Event ist erforderlich')
    .max(10, 'Zu viele Events'),
});

/**
 * API key creation validation
 */
export const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich')
    .max(50, 'Name ist zu lang')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Ungültige Zeichen im Namen'),
  expiresIn: z.enum(['30d', '90d', '365d', 'never']).optional(),
});

/**
 * ID parameter validation
 */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ===========================
// 🔍 REQUEST HELPERS
// ===========================

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }
  
  return 'unknown';
}

/**
 * Sanitize string for safe output
 */
export function sanitizeOutput(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ===========================
// 🚨 ERROR HANDLING
// ===========================

/**
 * Safe error handler that doesn't leak internal details
 */
export function handleApiError(
  error: unknown,
  context: string
): NextResponse {
  // Log the full error internally
  console.error(`[${context}] Error:`, error);
  
  // Log security event for monitoring
  logSecurityEvent({
    type: 'suspicious_request',
    ip: 'server',
    details: {
      context,
      error: error instanceof Error ? error.message : 'Unknown error',
    },
    timestamp: new Date(),
  });
  
  // Return generic error to client
  return secureErrorResponse(ApiErrors.INTERNAL_ERROR);
}
