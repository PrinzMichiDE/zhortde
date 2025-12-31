import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns, links } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { isUrlBlocked } from '@/lib/blocklist';
import { logLinkAction, type AuditLogChanges } from '@/lib/audit-log';
import { monetizeUrl } from '@/lib/monetization';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { linkId } = await params;
    const linkIdNum = parseInt(linkId);
    const userId = parseInt(session.user.id);

    // Get current link
    const currentLink = await db.query.links.findFirst({
      where: and(eq(links.id, linkIdNum), eq(links.userId, userId)),
    });

    if (!currentLink) {
      return NextResponse.json(
        { error: 'Link nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { longUrl: rawLongUrl, isPublic, shortCode, campaignId } = body as Record<string, unknown>; // Allow basic updates

    const updateData: Partial<typeof links.$inferInsert> = {};
    const changes: AuditLogChanges = {};

    // Validate and check longUrl
    if (rawLongUrl !== undefined && typeof rawLongUrl !== 'string') {
      return NextResponse.json({ error: 'Ungültige URL' }, { status: 400 });
    }

    if (typeof rawLongUrl === 'string' && rawLongUrl && rawLongUrl !== currentLink.longUrl) {
      // Basic validation
      try {
        new URL(rawLongUrl);
      } catch {
        return NextResponse.json({ error: 'Ungültige URL' }, { status: 400 });
      }

      // Monetize (Amazon Affiliate)
      const longUrl = monetizeUrl(rawLongUrl);

      // Blocklist check (on raw url preferably, or monetized)
      if (await isUrlBlocked(rawLongUrl)) {
        return NextResponse.json({ error: 'Domain ist blockiert' }, { status: 403 });
      }
      
      if (longUrl !== currentLink.longUrl) {
         updateData.longUrl = longUrl;
         changes.longUrl = { from: currentLink.longUrl, to: longUrl };
         if (longUrl !== rawLongUrl) {
            changes.isMonetized = true;
         }
      }
    }

    // Update public status
    if (isPublic !== undefined && typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'Ungültiger isPublic Wert' }, { status: 400 });
    }

    if (typeof isPublic === 'boolean' && isPublic !== currentLink.isPublic) {
      updateData.isPublic = isPublic;
      changes.isPublic = { from: currentLink.isPublic, to: isPublic };
    }

    // Update shortCode (if allowed in your logic - usually restricted, but let's allow it for now)
    if (shortCode !== undefined && typeof shortCode !== 'string') {
      return NextResponse.json({ error: 'Ungültiger Short Code' }, { status: 400 });
    }

    if (typeof shortCode === 'string' && shortCode && shortCode !== currentLink.shortCode) {
        // Basic validation
        if (!/^[a-z0-9-_]+$/.test(shortCode)) {
             return NextResponse.json({ error: 'Ungültiger Short Code' }, { status: 400 });
        }
        // Check uniqueness
        const existing = await db.query.links.findFirst({ where: eq(links.shortCode, shortCode) });
        if (existing) {
             return NextResponse.json({ error: 'Short Code vergeben' }, { status: 409 });
        }
        updateData.shortCode = shortCode;
        changes.shortCode = { from: currentLink.shortCode, to: shortCode };
    }

    // Update campaign attachment (campaignId can be number or null)
    if (campaignId !== undefined) {
      const nextCampaignId =
        campaignId === null
          ? null
          : typeof campaignId === 'number' && Number.isInteger(campaignId) && campaignId > 0
            ? campaignId
            : undefined;

      if (nextCampaignId === undefined) {
        return NextResponse.json({ error: 'Ungültige campaignId (number oder null)' }, { status: 400 });
      }

      if (nextCampaignId === null) {
        if (currentLink.campaignId !== null) {
          updateData.campaignId = null;
          changes.campaignId = { from: currentLink.campaignId, to: null };
        }
      } else if (nextCampaignId !== currentLink.campaignId) {
        // Ownership check
        const ownedCampaign = await db.query.campaigns.findFirst({
          where: and(eq(campaigns.id, nextCampaignId), eq(campaigns.userId, userId)),
        });
        if (!ownedCampaign) {
          return NextResponse.json({ error: 'Kampagne nicht gefunden oder keine Berechtigung' }, { status: 404 });
        }
        updateData.campaignId = nextCampaignId;
        changes.campaignId = { from: currentLink.campaignId, to: nextCampaignId };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(currentLink); // No changes
    }

    const [updatedLink] = await db
      .update(links)
      .set(updateData)
      .where(eq(links.id, linkIdNum))
      .returning();

    // Audit Log
    await logLinkAction(linkIdNum, userId, 'updated', changes);

    return NextResponse.json(updatedLink);

  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Links' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const { linkId } = await params;
    const linkIdNum = parseInt(linkId);
    const userId = parseInt(session.user.id);

    // Lösche den Link nur, wenn er dem Benutzer gehört
    const result = await db
      .delete(links)
      .where(and(eq(links.id, linkIdNum), eq(links.userId, userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Link nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    // Audit Log (Deleted link)
    // Note: Link history is cascaded on delete, so we can't store logs FOR this link easily unless we keep history or soft delete.
    // For now, we log it before deletion? No, constraints will fail if we insert after delete if we reference linkId.
    // If we want to keep history of deleted links, we would need to make linkId nullable in history or not use FK.
    // Given the current schema (CASCADE delete), history is gone when link is gone.
    // Enterprise solution: Soft Delete (isActive = false).
    // For now, I will skip logging DELETE if schema forces cascade delete, or I should implement soft delete.
    // Let's stick to current behavior (Hard Delete) and accept history loss for now, as User didn't ask for Soft Delete.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Links' },
      { status: 500 }
    );
  }
}
