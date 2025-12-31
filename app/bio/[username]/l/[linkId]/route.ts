import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bioLinks } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

type RouteParams = {
  params: Promise<{ username: string; linkId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { username, linkId } = await params;

  const id = Number.parseInt(linkId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.redirect(new URL(`/bio/${encodeURIComponent(username)}`, request.nextUrl.origin), 302);
  }

  // Ensure the link belongs to the requested username and is active.
  const link = await db.query.bioLinks.findFirst({
    where: and(eq(bioLinks.id, id), eq(bioLinks.isActive, true)),
    with: {
      profile: true,
    },
  });

  if (!link || !link.profile) {
    return NextResponse.redirect(new URL(`/bio/${encodeURIComponent(username)}`, request.nextUrl.origin), 302);
  }

  if (link.profile.username !== username || !link.profile.isActive) {
    return NextResponse.redirect(new URL(`/bio/${encodeURIComponent(username)}`, request.nextUrl.origin), 302);
  }

  // Only allow safe external redirects.
  let target: URL | null = null;
  try {
    target = new URL(link.url);
    if (!['http:', 'https:'].includes(target.protocol)) {
      target = null;
    }
  } catch {
    target = null;
  }

  if (!target) {
    return NextResponse.redirect(new URL(`/bio/${encodeURIComponent(username)}`, request.nextUrl.origin), 302);
  }

  // Best-effort click tracking (don’t block redirect on DB issues).
  db.update(bioLinks)
    .set({ clicks: sql`${bioLinks.clicks} + 1` })
    .where(and(eq(bioLinks.id, id), eq(bioLinks.profileId, link.profileId)))
    .catch(() => {});

  return NextResponse.redirect(target.toString(), 302);
}

