/**
 * Password Share Access API
 * 
 * GET /api/passwords/[shareId] - Access encrypted password
 * DELETE /api/passwords/[shareId] - Delete password share
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sharedPasswords } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAccessKey } from '@/lib/e2e-encryption';
import { requireAuth } from '@/lib/api-security';
import { z } from 'zod';

const accessSchema = z.object({
  accessKey: z.string().min(1),
});

/**
 * GET /api/passwords/[shareId]
 * Retrieve encrypted password (requires access key)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    
    // Get access key from query or header
    const accessKey = request.nextUrl.searchParams.get('accessKey') || 
                     request.headers.get('x-access-key') || '';
    
    if (!accessKey) {
      return NextResponse.json(
        { error: 'Access key required' },
        { status: 400 }
      );
    }

    // Find password share
    const share = await db.query.sharedPasswords.findFirst({
      where: eq(sharedPasswords.shareId, shareId),
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Password share not found' },
        { status: 404 }
      );
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Password share has expired' },
        { status: 410 }
      );
    }

    // Check max accesses
    if (share.maxAccesses && share.currentAccesses >= share.maxAccesses) {
      return NextResponse.json(
        { error: 'Maximum access limit reached' },
        { status: 403 }
      );
    }

    // Verify access key
    const isValid = await verifyAccessKey(accessKey, share.accessKey);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid access key' },
        { status: 401 }
      );
    }

    // Increment access count
    await db
      .update(sharedPasswords)
      .set({
        currentAccesses: share.currentAccesses + 1,
        lastAccessedAt: new Date(),
      })
      .where(eq(sharedPasswords.id, share.id));

    // Return encrypted data (client will decrypt)
    return NextResponse.json({
      encryptedPassword: share.encryptedPassword,
      encryptedMetadata: share.encryptedMetadata,
      encryptionKeyHash: share.encryptionKeyHash,
      // Include metadata for UI
      currentAccesses: share.currentAccesses + 1,
      maxAccesses: share.maxAccesses,
    });
  } catch (error) {
    console.error('Error accessing password share:', error);
    return NextResponse.json(
      { error: 'Failed to access password share' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/passwords/[shareId]
 * Delete password share
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const auth = await requireAuth();
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find and verify ownership
    const share = await db.query.sharedPasswords.findFirst({
      where: eq(sharedPasswords.shareId, shareId),
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Password share not found' },
        { status: 404 }
      );
    }

    if (share.userId !== auth.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete
    await db
      .delete(sharedPasswords)
      .where(eq(sharedPasswords.id, share.id));

    return NextResponse.json({
      success: true,
      message: 'Password share deleted',
    });
  } catch (error) {
    console.error('Error deleting password share:', error);
    return NextResponse.json(
      { error: 'Failed to delete password share' },
      { status: 500 }
    );
  }
}
