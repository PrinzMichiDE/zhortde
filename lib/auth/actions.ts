'use server';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { 
  emailSchema, 
  passwordSchema, 
  logSecurityEvent,
} from '@/lib/security';

/**
 * Register a new user with comprehensive validation
 * OWASP compliant: Input validation, secure password hashing, security logging
 */
export async function registerUser(email: string, password: string) {
  try {
    // 1. Validate email format
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      return { 
        success: false, 
        error: emailResult.error.issues[0]?.message || 'Ungültige E-Mail-Adresse' 
      };
    }
    const validatedEmail = emailResult.data;

    // 2. Validate password strength
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      return { 
        success: false, 
        error: passwordResult.error.issues[0]?.message || 'Passwort erfüllt nicht die Sicherheitsanforderungen' 
      };
    }

    // 3. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedEmail),
    });

    if (existingUser) {
      // Log potential enumeration attempt
      logSecurityEvent({
        type: 'auth_failure',
        ip: 'server',
        details: { 
          reason: 'email_exists', 
          email: validatedEmail 
        },
        timestamp: new Date(),
      });
      return { success: false, error: 'E-Mail bereits registriert' };
    }

    // 4. Hash password with bcrypt (cost factor 12 for better security)
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Create user
    const newUser = await db.insert(users).values({
      email: validatedEmail,
      passwordHash,
      role: 'user',
    }).returning();

    // 6. Log successful registration
    logSecurityEvent({
      type: 'auth_success',
      userId: newUser[0]?.id,
      ip: 'server',
      details: { 
        action: 'registration',
        email: validatedEmail,
      },
      timestamp: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Log error for security monitoring
    logSecurityEvent({
      type: 'auth_failure',
      ip: 'server',
      details: { 
        reason: 'registration_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date(),
    });
    
    return { success: false, error: 'Registrierung fehlgeschlagen' };
  }
}

/**
 * Check password strength (for client-side preview)
 */
export async function checkPasswordStrength(password: string): Promise<{
  score: number;
  feedback: string[];
}> {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Mindestens 8 Zeichen');

  if (password.length >= 12) score += 1;
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Mindestens ein Großbuchstabe');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Mindestens ein Kleinbuchstabe');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Mindestens eine Zahl');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Mindestens ein Sonderzeichen');

  // Check for common patterns
  const commonPatterns = [
    /^12345/,
    /password/i,
    /qwerty/i,
    /abc123/i,
  ];
  
  if (commonPatterns.some(p => p.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Vermeiden Sie häufige Muster');
  }

  return { score, feedback };
}

