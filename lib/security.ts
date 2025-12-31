/**
 * Security Library
 * Comprehensive security utilities for OWASP Top 10 compliance
 */

import { z } from 'zod';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// ===========================
// 🔒 INPUT VALIDATION SCHEMAS
// ===========================

/**
 * Email validation with strict pattern
 */
export const emailSchema = z
  .string()
  .min(1, 'E-Mail ist erforderlich')
  .max(254, 'E-Mail ist zu lang')
  .email('Ungültige E-Mail-Adresse')
  .transform((email) => email.toLowerCase().trim());

/**
 * Password validation with security requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
  .max(128, 'Passwort ist zu lang')
  .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten')
  .regex(/[^A-Za-z0-9]/, 'Passwort muss mindestens ein Sonderzeichen enthalten');

/**
 * Simple password validation (less strict for link passwords)
 */
export const simplePasswordSchema = z
  .string()
  .min(4, 'Passwort muss mindestens 4 Zeichen lang sein')
  .max(128, 'Passwort ist zu lang');

/**
 * URL validation with security checks
 */
export const urlSchema = z
  .string()
  .min(1, 'URL ist erforderlich')
  .max(2048, 'URL ist zu lang')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Ungültige URL - nur HTTP und HTTPS sind erlaubt')
  .refine((url) => {
    // Block localhost and private IPs (SSRF prevention)
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      
      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return false;
      }
      
      // Block private IP ranges
      const privatePatterns = [
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^fc00:/i,
        /^fe80:/i,
      ];
      
      return !privatePatterns.some(pattern => pattern.test(hostname));
    } catch {
      return false;
    }
  }, 'Private oder lokale URLs sind nicht erlaubt');

/**
 * Short code validation
 */
export const shortCodeSchema = z
  .string()
  .min(3, 'Short Code muss mindestens 3 Zeichen lang sein')
  .max(50, 'Short Code darf maximal 50 Zeichen lang sein')
  .regex(/^[a-z0-9-_]+$/, 'Short Code darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten')
  .transform((code) => code.toLowerCase().trim());

/**
 * Username validation (for bio profiles)
 */
export const usernameSchema = z
  .string()
  .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
  .max(30, 'Benutzername darf maximal 30 Zeichen lang sein')
  .regex(/^[a-z0-9_-]+$/, 'Benutzername darf nur Kleinbuchstaben, Zahlen, Bindestriche und Unterstriche enthalten')
  .transform((username) => username.toLowerCase().trim());

/**
 * Search query validation (prevent injection)
 */
export const searchQuerySchema = z
  .string()
  .max(200, 'Suchanfrage ist zu lang')
  .transform((query) => query.trim())
  .refine((query) => !/[<>'"`;]/.test(query), 'Ungültige Zeichen in Suchanfrage');

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Link creation schema
 */
export const createLinkSchema = z.object({
  longUrl: urlSchema,
  customCode: shortCodeSchema.optional(),
  password: simplePasswordSchema.optional(),
  expiresIn: z.enum(['1h', '24h', '7d', '30d', 'never']).optional(),
  isPublic: z.boolean().default(true),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
});

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

/**
 * Team creation schema
 */
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, 'Teamname ist erforderlich')
    .max(100, 'Teamname ist zu lang')
    .transform((name) => name.trim()),
});

/**
 * Campaign creation schema
 */
export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Kampagnenname ist erforderlich')
    .max(120, 'Kampagnenname ist zu lang')
    .transform((name) => name.trim()),
  description: z
    .string()
    .max(500, 'Beschreibung ist zu lang')
    .optional()
    .transform((v) => (typeof v === 'string' ? v.trim() : v)),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
});

/**
 * Campaign attachment schema (for links)
 */
export const updateLinkCampaignSchema = z.object({
  campaignId: z.union([z.number().int().positive(), z.null()]),
});

/**
 * Webhook URL schema
 */
export const webhookUrlSchema = z
  .string()
  .url('Ungültige Webhook-URL')
  .max(500, 'URL ist zu lang')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Webhook-URL muss HTTPS verwenden');

/**
 * API Key name schema
 */
export const apiKeyNameSchema = z
  .string()
  .min(1, 'Name ist erforderlich')
  .max(50, 'Name ist zu lang')
  .regex(/^[a-zA-Z0-9\s_-]+$/, 'Ungültige Zeichen im Namen');

// ===========================
// 🛡️ XSS PREVENTION
// ===========================

/**
 * HTML entities to escape
 */
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string): string {
  return escapeHtml(input.trim());
}

/**
 * Remove all HTML tags from string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

// ===========================
// 🔑 CSRF PROTECTION
// ===========================

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token using timing-safe comparison
 */
export function verifyCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  
  try {
    const tokenBuffer = Buffer.from(token);
    const storedBuffer = Buffer.from(storedToken);
    
    if (tokenBuffer.length !== storedBuffer.length) return false;
    
    return timingSafeEqual(tokenBuffer, storedBuffer);
  } catch {
    return false;
  }
}

// ===========================
// 🔐 SECURE HASHING
// ===========================

/**
 * Create a SHA-256 hash of a string
 */
export function sha256(str: string): string {
  return createHash('sha256').update(str).digest('hex');
}

/**
 * Create a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate an API key with prefix
 */
export function generateApiKey(prefix: string = 'zhort'): { key: string; hash: string; prefix: string } {
  const token = randomBytes(24).toString('base64url');
  const fullKey = `${prefix}_${token}`;
  const hash = sha256(fullKey);
  const keyPrefix = fullKey.substring(0, 12);
  
  return { key: fullKey, hash, prefix: keyPrefix };
}

// ===========================
// 🚫 INJECTION PREVENTION
// ===========================

/**
 * Check for SQL injection patterns
 */
export function hasSqlInjection(str: string): boolean {
  const patterns = [
    /'\s*or\s+'?1'?\s*=\s*'?1/i,
    /'\s*or\s+''='/i,
    /'\s*;\s*drop\s+table/i,
    /'\s*;\s*delete\s+from/i,
    /union\s+select/i,
    /insert\s+into/i,
    /exec\s*\(/i,
    /xp_cmdshell/i,
    /--\s*$/,
    /\/\*.*\*\//,
  ];
  
  return patterns.some(pattern => pattern.test(str));
}

/**
 * Check for command injection patterns
 */
export function hasCommandInjection(str: string): boolean {
  const patterns = [
    /;\s*rm\s+-rf/i,
    /;\s*cat\s+\/etc/i,
    /\$\(.*\)/,
    /`.*`/,
    /\|\s*sh\s*/i,
    /\|\s*bash/i,
    /&&\s*wget/i,
    /&&\s*curl/i,
  ];
  
  return patterns.some(pattern => pattern.test(str));
}

/**
 * Validate input doesn't contain injection patterns
 */
export function isSecureInput(str: string): boolean {
  return !hasSqlInjection(str) && !hasCommandInjection(str);
}

// ===========================
// 📊 AUDIT LOGGING
// ===========================

export type SecurityEvent = {
  type: 'auth_success' | 'auth_failure' | 'rate_limit' | 'suspicious_request' | 'permission_denied' | 'data_access';
  userId?: number;
  ip: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
};

/**
 * Log a security event
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // In production, this would write to a dedicated security log/SIEM
  const logEntry = {
    ...event,
    timestamp: event.timestamp.toISOString(),
  };
  
  if (process.env.NODE_ENV === 'production') {
    console.log('[SECURITY]', JSON.stringify(logEntry));
  } else {
    console.log('[SECURITY]', logEntry);
  }
}

// ===========================
// 🛡️ REQUEST VALIDATION
// ===========================

/**
 * Validate request origin
 */
export function isValidOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  
  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return originUrl.hostname.endsWith(domain);
      }
      return originUrl.origin === allowed;
    });
  } catch {
    return false;
  }
}

/**
 * Extract and validate content type
 */
export function isValidContentType(contentType: string | null, expected: string[]): boolean {
  if (!contentType) return false;
  
  const type = contentType.split(';')[0].trim().toLowerCase();
  return expected.includes(type);
}

/**
 * Validate JSON request body size
 */
export function isValidBodySize(body: unknown, maxSizeBytes: number): boolean {
  const size = JSON.stringify(body).length;
  return size <= maxSizeBytes;
}

// ===========================
// 🔄 SAFE PARSING UTILITIES
// ===========================

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(str: string): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(str) as T;
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

/**
 * Safely parse integer with bounds checking
 */
export function safeParseInt(str: string, min: number = Number.MIN_SAFE_INTEGER, max: number = Number.MAX_SAFE_INTEGER): number | null {
  const num = parseInt(str, 10);
  if (isNaN(num) || num < min || num > max) {
    return null;
  }
  return num;
}

// ===========================
// 🎯 TYPE EXPORTS
// ===========================

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateLinkCampaignInput = z.infer<typeof updateLinkCampaignSchema>;
