import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createApiKey } from '@/lib/api-keys';
import { logAuditEvent } from '@/lib/enterprise-features';
import {
  requireAuth,
  validateBody,
  apiKeySchema,
  secureResponse,
  secureErrorResponse,
  ApiErrors,
  handleApiError,
} from '@/lib/api-security';

// Maximum API keys per user
const MAX_API_KEYS = 10;

/**
 * GET /api/user/api-keys - List user's API keys
 */
export async function GET() {
  try {
    // 1. Require authentication
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    // 2. Fetch user's API keys (never expose the hash)
    const userApiKeys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, auth.userId));

    return secureResponse({ apiKeys: userApiKeys });
  } catch (error) {
    return handleApiError(error, 'api-keys/GET');
  }
}

/**
 * POST /api/user/api-keys - Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Require authentication
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    // 2. Validate request body
    const validation = await validateBody(request, apiKeySchema);
    if (!validation.success) {
      return secureErrorResponse(ApiErrors.VALIDATION_ERROR(validation.error));
    }

    const { name, expiresIn } = validation.data;

    // 3. Check API key limit
    const existingKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.userId, auth.userId));
    
    if (existingKeys.length >= MAX_API_KEYS) {
      return secureErrorResponse(
        ApiErrors.VALIDATION_ERROR(`Maximum ${MAX_API_KEYS} API keys allowed`)
      );
    }

    // 4. Create API key
    const apiKey = await createApiKey(auth.userId, name.trim(), expiresIn);

    // 5. Audit trail (never blocks the response)
    logAuditEvent({
      userId: auth.userId,
      action: 'api_key.created',
      resourceType: 'api_key',
      resourceId: apiKey.id,
      changes: { name: name.trim(), expiresIn: expiresIn || 'never' },
    }).catch((error) => {
      console.error('Audit log error:', error);
    });

    // Note: The full key is only returned on creation
    return secureResponse({ apiKey }, 201);
  } catch (error) {
    return handleApiError(error, 'api-keys/POST');
  }
}

