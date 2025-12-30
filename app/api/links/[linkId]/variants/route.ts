import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLinkVariants, createVariant, deleteVariant, setWinnerVariant } from '@/lib/ab-testing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const variants = await getLinkVariants(linkIdNum);

    return NextResponse.json({ success: true, variants });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const variant = await createVariant(
      linkIdNum,
      body.variantUrl,
      body.trafficPercentage || 50
    );

    return NextResponse.json({ success: true, variant });
  } catch (error) {
    console.error('Error creating variant:', error);
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');

    if (!session || !variantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await deleteVariant(parseInt(variantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkIdNum = parseInt(linkId);
    const link = await db.query.links.findFirst({
      where: eq(links.id, linkIdNum),
    });

    if (!link || link.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    await setWinnerVariant(linkIdNum, body.variantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting winner:', error);
    return NextResponse.json({ error: 'Failed to set winner' }, { status: 500 });
  }
}
