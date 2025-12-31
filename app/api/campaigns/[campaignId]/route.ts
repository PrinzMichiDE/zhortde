import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { createCampaignSchema } from '@/lib/security';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError(401, 'UNAUTHORIZED', 'Nicht autorisiert');
  }

  const { campaignId } = await params;
  const id = parseInt(campaignId);
  if (!Number.isFinite(id)) {
    return jsonError(400, 'INVALID_ID', 'Ungültige ID');
  }

  const userId = parseInt(session.user.id);
  const campaign = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
  });

  if (!campaign) {
    return jsonError(404, 'NOT_FOUND', 'Kampagne nicht gefunden');
  }

  return NextResponse.json({ data: campaign });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError(401, 'UNAUTHORIZED', 'Nicht autorisiert');
  }

  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return jsonError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json');
  }

  const { campaignId } = await params;
  const id = parseInt(campaignId);
  if (!Number.isFinite(id)) {
    return jsonError(400, 'INVALID_ID', 'Ungültige ID');
  }

  const userId = parseInt(session.user.id);
  const existing = await db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, id), eq(campaigns.userId, userId)),
  });

  if (!existing) {
    return jsonError(404, 'NOT_FOUND', 'Kampagne nicht gefunden');
  }

  const body = await request.json();
  const parsed = createCampaignSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Ungültige Eingabe', parsed.error.flatten());
  }

  const [updated] = await db
    .update(campaigns)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonError(401, 'UNAUTHORIZED', 'Nicht autorisiert');
  }

  const { campaignId } = await params;
  const id = parseInt(campaignId);
  if (!Number.isFinite(id)) {
    return jsonError(400, 'INVALID_ID', 'Ungültige ID');
  }

  const userId = parseInt(session.user.id);
  const deleted = await db
    .delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
    .returning();

  if (deleted.length === 0) {
    return jsonError(404, 'NOT_FOUND', 'Kampagne nicht gefunden');
  }

  return NextResponse.json({ success: true });
}

