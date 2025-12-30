import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { bioProfiles, bioLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9-_]+$/),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  links: z.array(z.object({
    title: z.string().min(1),
    url: z.string().url(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const profile = await db.query.bioProfiles.findFirst({
      where: eq(bioProfiles.userId, userId),
      with: {
        links: true, // Auto-fetch links
      }
    });

    return NextResponse.json(profile || null);
  } catch (error) {
    console.error('Error fetching bio profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { username, displayName, bio, links } = validation.data;

    // Check if username is taken (by another user)
    const existing = await db.query.bioProfiles.findFirst({
      where: eq(bioProfiles.username, username),
    });

    if (existing && existing.userId !== userId) {
      return NextResponse.json({ error: 'Username bereits vergeben' }, { status: 409 });
    }

    // Upsert Profile & Replace Links
    const result = await db.transaction(async (tx) => {
      // 1. Upsert Profile
      let profileId: number;
      
      const currentProfile = await tx.query.bioProfiles.findFirst({
        where: eq(bioProfiles.userId, userId),
      });

      if (currentProfile) {
        await tx.update(bioProfiles)
          .set({ username, displayName, bio, updatedAt: new Date() })
          .where(eq(bioProfiles.id, currentProfile.id));
        profileId = currentProfile.id;
      } else {
        const [newProfile] = await tx.insert(bioProfiles)
          .values({ userId, username, displayName, bio })
          .returning();
        profileId = newProfile.id;
      }

      // 2. Replace Links (Delete all, insert new)
      await tx.delete(bioLinks).where(eq(bioLinks.profileId, profileId));

      if (links.length > 0) {
        await tx.insert(bioLinks).values(
          links.map((link, index) => ({
            profileId,
            title: link.title,
            url: link.url,
            position: index,
          }))
        );
      }

      return profileId;
    });

    return NextResponse.json({ success: true, profileId: result });

  } catch (error) {
    console.error('Error saving bio profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
