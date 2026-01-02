/**
 * Password Sharing API
 * End-to-End Encrypted Password Sharing
 * 
 * POST /api/passwords - Create encrypted password share
 * GET /api/passwords/[shareId] - Retrieve encrypted password (requires access key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sharedPasswords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { 
  encryptPassword, 
  generateShareId, 
  hashAccessKey, 
  verifyAccessKey,
  hashEncryptionKey 
} from '@/lib/e2e-encryption';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-security';
import { nanoid } from 'nanoid';

const createPasswordSchema = z.object({
  encryptedPassword: z.string().min(1), // Base64 encoded encrypted password data
  encryptedMetadata: z.string().optional(),
  encryptionKeyHash: z.string().optional(), // For verification
  accessKey: z.string().min(4).max(128), // Password to access the share
  maxAccesses: z.number().int().min(1).max(1000).optional(),
  expiresIn: z.string().optional(), // '1h', '24h', '7d', '30d', 'never'
});

const accessPasswordSchema = z.object({
  accessKey: z.string().min(1),
});

/**
 * POST /api/passwords
 * Create a new encrypted password share
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const userId = auth?.userId || null;

    const body = await request.json();
    const validated = createPasswordSchema.parse(body);

    // Generate unique share ID
    let shareId: string;
    let exists = true;
    while (exists) {
      shareId = generateShareId(12);
      const existing = await db.query.sharedPasswords.findFirst({
        where: eq(sharedPasswords.shareId, shareId),
      });
      exists = !!existing;
    }

    // Hash access key
    const accessKeyHash = await hashAccessKey(validated.accessKey);

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (validated.expiresIn && validated.expiresIn !== 'never') {
      const now = new Date();
      const [value, unit] = validated.expiresIn.split('-');
      const num = parseInt(value);

      switch (unit) {
        case 'hour':
          expiresAt = new Date(now.getTime() + num * 60 * 60 * 1000);
          break;
        case 'day':
          expiresAt = new Date(now.getTime() + num * 24 * 60 * 60 * 1000);
          break;
        case 'week':
          expiresAt = new Date(now.getTime() + num * 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          expiresAt = new Date(now.getTime() + num * 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Create password share
    const [created] = await db
      .insert(sharedPasswords)
      .values({
        shareId: shareId!,
        userId,
        encryptedPassword: validated.encryptedPassword,
        encryptedMetadata: validated.encryptedMetadata || null,
        encryptionKeyHash: validated.encryptionKeyHash || null,
        accessKey: accessKeyHash,
        maxAccesses: validated.maxAccesses || null,
        expiresAt,
      })
      .returning();

    return NextResponse.json({
      success: true,
      shareId: created.shareId,
      shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/passwords/${created.shareId}`,
      expiresAt: created.expiresAt,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating password share:', error);
    return NextResponse.json(
      { error: 'Failed to create password share' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/passwords
 * List user's password shares
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const shares = await db.query.sharedPasswords.findMany({
      where: eq(sharedPasswords.userId, auth.userId),
      orderBy: (shares, { desc }) => [desc(shares.createdAt)],
    });

    // Return metadata only (no encrypted data)
    return NextResponse.json({
      shares: shares.map(share => ({
        id: share.id,
        shareId: share.shareId,
        shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/passwords/${share.shareId}`,
        currentAccesses: share.currentAccesses,
        maxAccesses: share.maxAccesses,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
        lastAccessedAt: share.lastAccessedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching password shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch password shares' },
      { status: 500 }
    );
  }
}
