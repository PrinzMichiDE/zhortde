/**
 * P2P File Share Access API
 * 
 * GET /api/p2p/files/[shareId] - Get file share metadata
 * POST /api/p2p/files/[shareId]/signal - WebRTC signaling endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { p2pFileShares } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAccessKey } from '@/lib/e2e-encryption';

/**
 * GET /api/p2p/files/[shareId]
 * Get file share metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    
    // Get access key from query or header (optional)
    const accessKey = request.nextUrl.searchParams.get('accessKey') || 
                     request.headers.get('x-access-key') || '';

    // Find file share
    const share = await db.query.p2pFileShares.findFirst({
      where: eq(p2pFileShares.shareId, shareId),
    });

    if (!share) {
      return NextResponse.json(
        { error: 'File share not found' },
        { status: 404 }
      );
    }

    // Check expiration
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'File share has expired' },
        { status: 410 }
      );
    }

    // Check if access key is required
    if (share.accessKey) {
      if (!accessKey) {
        return NextResponse.json(
          { error: 'Access key required' },
          { status: 401 }
        );
      }

      const isValid = await verifyAccessKey(accessKey, share.accessKey);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid access key' },
          { status: 401 }
        );
      }
    }

    // Check max accesses
    if (share.maxAccesses && share.currentAccesses >= share.maxAccesses) {
      return NextResponse.json(
        { error: 'Maximum access limit reached' },
        { status: 403 }
      );
    }

    // Increment access count
    await db
      .update(p2pFileShares)
      .set({
        currentAccesses: share.currentAccesses + 1,
        lastAccessedAt: new Date(),
      })
      .where(eq(p2pFileShares.id, share.id));

    // Return metadata (no file data - file is transferred P2P)
    return NextResponse.json({
      shareId: share.shareId,
      fileName: share.fileName,
      fileSize: share.fileSize,
      fileType: share.fileType,
      fileHash: share.fileHash,
      signalingToken: share.signalingToken,
      currentAccesses: share.currentAccesses + 1,
      maxAccesses: share.maxAccesses,
    });
  } catch (error) {
    console.error('Error accessing file share:', error);
    return NextResponse.json(
      { error: 'Failed to access file share' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/p2p/files/[shareId]/signal
 * WebRTC signaling endpoint (minimal implementation)
 * In production, use WebSocket for real-time signaling
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;
    const body = await request.json();
    const { action, offer, answer, candidate } = body;

    // Find file share
    const share = await db.query.p2pFileShares.findFirst({
      where: eq(p2pFileShares.shareId, shareId),
    });

    if (!share) {
      return NextResponse.json(
        { error: 'File share not found' },
        { status: 404 }
      );
    }

    // Store WebRTC offer/answer temporarily (in production, use Redis or WebSocket)
    if (action === 'store-offer' && offer) {
      await db
        .update(p2pFileShares)
        .set({ webrtcOffer: JSON.stringify(offer) })
        .where(eq(p2pFileShares.id, share.id));

      return NextResponse.json({ success: true });
    }

    if (action === 'get-offer') {
      const offerData = share.webrtcOffer ? JSON.parse(share.webrtcOffer) : null;
      return NextResponse.json({ offer: offerData });
    }

    if (action === 'store-answer' && answer) {
      await db
        .update(p2pFileShares)
        .set({ webrtcAnswer: JSON.stringify(answer) })
        .where(eq(p2pFileShares.id, share.id));

      return NextResponse.json({ success: true });
    }

    if (action === 'get-answer') {
      const answerData = share.webrtcAnswer ? JSON.parse(share.webrtcAnswer) : null;
      return NextResponse.json({ answer: answerData });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in signaling:', error);
    return NextResponse.json(
      { error: 'Signaling failed' },
      { status: 500 }
    );
  }
}
