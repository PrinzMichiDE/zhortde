import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { nanoid } from 'nanoid';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { hashPassword, calculateExpiration } from '@/lib/password-protection';
import { 
  validateBody, 
  pasteSchema, 
  secureResponse, 
  secureErrorResponse, 
  ApiErrors,
  handleApiError,
} from '@/lib/api-security';
import { logSecurityEvent, isSecureInput } from '@/lib/security';

// Maximum paste size: 500KB
const MAX_PASTE_SIZE = 512000;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const clientIp = getClientIp(request);

    // 1. Rate limiting
    const identifier = session?.user?.id || clientIp;
    const action = session?.user?.id ? 'create_paste_authenticated' : 'create_paste_anonymous';
    const rateLimitResult = await checkRateLimit(identifier, action);

    if (!rateLimitResult.success) {
      logSecurityEvent({
        type: 'rate_limit',
        ip: clientIp,
        userId: session?.user?.id ? parseInt(session.user.id) : undefined,
        details: { action, limit: rateLimitResult.limit },
        timestamp: new Date(),
      });
      
      return NextResponse.json(
        { 
          error: 'Zu viele Anfragen',
          reset: rateLimitResult.reset,
        },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // 2. Validate request body with Zod
    const validation = await validateBody(request, pasteSchema, MAX_PASTE_SIZE);
    if (!validation.success) {
      return secureErrorResponse(ApiErrors.VALIDATION_ERROR(validation.error));
    }

    const { content, syntaxHighlightingLanguage, isPublic, password, expiresIn } = validation.data;

    // 3. Security check: Detect potential injection in content
    // Note: We allow HTML/JS in pastes but log suspicious patterns
    if (!isSecureInput(content.substring(0, 1000))) {
      logSecurityEvent({
        type: 'suspicious_request',
        ip: clientIp,
        details: { reason: 'potential_injection_in_paste' },
        timestamp: new Date(),
      });
      // We still allow it (pastebin functionality) but it's logged
    }

    // 4. Generate unique slug
    const slug = nanoid(10);

    // 5. Hash password if provided
    const passwordHash = password ? await hashPassword(password) : null;

    // 6. Calculate expiration if provided
    const expiresAt = expiresIn ? calculateExpiration(expiresIn) : null;

    // 7. Create paste
    const newPaste = await db.insert(pastes).values({
      slug,
      content,
      syntaxHighlightingLanguage: syntaxHighlightingLanguage || null,
      userId: session?.user?.id ? parseInt(session.user.id) : null,
      isPublic: session ? isPublic : true,
      passwordHash,
      expiresAt,
    }).returning();

    return secureResponse(
      {
        slug: newPaste[0].slug,
        expiresAt: newPaste[0].expiresAt,
        hasPassword: !!newPaste[0].passwordHash,
      },
      201,
      getRateLimitHeaders(rateLimitResult)
    );
  } catch (error) {
    return handleApiError(error, 'pastes/POST');
  }
}

