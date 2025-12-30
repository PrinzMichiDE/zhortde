/**
 * Environment Variables Validation & Security
 * Validates required environment variables at startup
 */

import { z } from 'zod';

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Database (required)
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((url) => {
      try {
        new URL(url);
        return url.startsWith('postgres://') || url.startsWith('postgresql://');
      } catch {
        return false;
      }
    }, 'DATABASE_URL must be a valid PostgreSQL connection string'),

  // NextAuth (required)
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL')
    .optional(),
  
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security')
    .optional(),

  // Optional integrations
  GOOGLE_SAFE_BROWSING_KEY: z.string().optional(),
  AMAZON_AFFILIATE_TAG: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Call this at app startup
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    return { valid: false, errors };
  }
  
  return { valid: true, errors: [] };
}

/**
 * Get validated environment variables
 * Throws if validation fails
 */
export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    
    throw new Error(
      `Environment validation failed:\n${errorMessages}\n\n` +
      'Please check your .env file or environment configuration.'
    );
  }
  
  return result.data;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || 
         process.env.NEXT_PUBLIC_BASE_URL || 
         'http://localhost:3000';
}

/**
 * Mask sensitive values for logging
 */
export function maskSensitiveValue(value: string): string {
  if (value.length <= 8) {
    return '****';
  }
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

/**
 * Log environment status (for debugging)
 * Only shows masked values, never full secrets
 */
export function logEnvStatus(): void {
  const env = process.env;
  
  console.log('Environment Status:');
  console.log('  NODE_ENV:', env.NODE_ENV || 'not set');
  console.log('  DATABASE_URL:', env.DATABASE_URL ? maskSensitiveValue(env.DATABASE_URL) : 'not set');
  console.log('  NEXTAUTH_URL:', env.NEXTAUTH_URL || 'not set');
  console.log('  NEXTAUTH_SECRET:', env.NEXTAUTH_SECRET ? 'set (length: ' + env.NEXTAUTH_SECRET.length + ')' : 'not set');
  console.log('  GOOGLE_SAFE_BROWSING_KEY:', env.GOOGLE_SAFE_BROWSING_KEY ? 'set' : 'not set');
}
