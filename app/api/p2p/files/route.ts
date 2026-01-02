/**
 * P2P File Sharing API
 * 
 * POST /api/p2p/files - Create P2P file share (metadata only)
 * GET /api/p2p/files - List user's P2P file shares
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { p2pFileShares } from '@/lib/db/schema';
import { generateP2PShareId, generateSignalingToken } from '@/lib/p2p-filesharing';
import { hashAccessKey } from '@/lib/e2e-encryption';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-security';
import { eq } from 'drizzle-orm';

const createFileShareSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  fileType: z.string().optional(),
  fileHash: z.string().optional(),
  accessKey: z.string().min(4).max(128).optional(),
  maxAccesses: z.number().int().min(1).max(1000).optional(),
  expiresIn: z.string().optional(),
});

/**
 * POST /api/p2p/files
 * Create P2P file share (metadata only - file never stored on server)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    const userId = auth?.userId || null;

    const body = await request.json();
    const validated = createFileShareSchema.parse(body);

    // Generate unique share ID
    let shareId: string;
    let exists = true;
    while (exists) {
      shareId = generateP2PShareId();
      const existing = await db.query.p2pFileShares.findFirst({
        where: eq(p2pFileShares.shareId, shareId),
      });
      exists = !!existing;
    }

    // Generate signaling token
    const signalingToken = generateSignalingToken();

    // Hash access key if provided
    let accessKeyHash: string | null = null;
    if (validated.accessKey) {
      accessKeyHash = await hashAccessKey(validated.accessKey);
    }

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

    // Create file share (metadata only)
    const [created] = await db
      .insert(p2pFileShares)
      .values({
        shareId: shareId!,
        userId,
        fileName: validated.fileName,
        fileSize: validated.fileSize,
        fileType: validated.fileType || null,
        fileHash: validated.fileHash || null,
        signalingToken,
        accessKey: accessKeyHash,
        maxAccesses: validated.maxAccesses || null,
        expiresAt,
      })
      .returning();

    return NextResponse.json({
      success: true,
      shareId: created.shareId,
      shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/p2p/${created.shareId}`,
      signalingToken, // Return token for WebRTC signaling
      expiresAt: created.expiresAt,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating P2P file share:', error);
    return NextResponse.json(
      { error: 'Failed to create file share' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/p2p/files
 * List user's P2P file shares
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

    const shares = await db.query.p2pFileShares.findMany({
      where: eq(p2pFileShares.userId, auth.userId),
      orderBy: (shares, { desc }) => [desc(shares.createdAt)],
    });

    return NextResponse.json({
      shares: shares.map(share => ({
        id: share.id,
        shareId: share.shareId,
        shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/p2p/${share.shareId}`,
        fileName: share.fileName,
        fileSize: share.fileSize,
        fileType: share.fileType,
        currentAccesses: share.currentAccesses,
        maxAccesses: share.maxAccesses,
        expiresAt: share.expiresAt,
        transferCompleted: share.transferCompleted,
        createdAt: share.createdAt,
        lastAccessedAt: share.lastAccessedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching P2P file shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file shares' },
      { status: 500 }
    );
  }
}
