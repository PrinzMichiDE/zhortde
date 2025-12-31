import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { bioProfiles, bioLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  requireAuth,
  validateBody,
  secureResponse,
  secureErrorResponse,
  ApiErrors,
  handleApiError,
} from '@/lib/api-security';

// Validation schema with security constraints
const updateProfileSchema = z.object({
  username: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z
      .string()
      .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
      .max(30, 'Benutzername darf maximal 30 Zeichen lang sein')
      .regex(
        /^[a-z0-9._-]+$/,
        'Benutzername darf nur Buchstaben, Zahlen, Punkte, Bindestriche und Unterstriche enthalten'
      )
  ),
  displayName: z
    .string()
    .max(100, 'Anzeigename ist zu lang')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio ist zu lang')
    .optional(),
  links: z.array(z.object({
    title: z
      .string()
      .min(1, 'Titel ist erforderlich')
      .max(100, 'Titel ist zu lang'),
    url: z
      .string()
      .url('Ungültige URL')
      .max(500, 'URL ist zu lang'),
  })).max(20, 'Maximal 20 Links erlaubt'),
});

// Maximum links per profile
const MAX_LINKS = 20;

export async function GET() {
  try {
    // 1. Require authentication
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    // 2. Fetch profile with links
    const profile = await db.query.bioProfiles.findFirst({
      where: eq(bioProfiles.userId, auth.userId),
      with: {
        links: true,
      }
    });

    return secureResponse(profile || null);
  } catch (error) {
    return handleApiError(error, 'bio/GET');
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Require authentication
    const auth = await requireAuth();
    if (!auth) {
      return secureErrorResponse(ApiErrors.UNAUTHORIZED);
    }

    // 2. Validate request body
    const validation = await validateBody(request, updateProfileSchema);
    if (!validation.success) {
      return secureErrorResponse(ApiErrors.VALIDATION_ERROR(validation.error));
    }

    const { username, displayName, bio, links } = validation.data;

    // 3. Check if username is taken (by another user)
    const existing = await db.query.bioProfiles.findFirst({
      where: eq(bioProfiles.username, username),
    });

    if (existing && existing.userId !== auth.userId) {
      return secureErrorResponse(ApiErrors.VALIDATION_ERROR('Benutzername bereits vergeben'));
    }

    // 4. Validate link count
    if (links.length > MAX_LINKS) {
      return secureErrorResponse(
        ApiErrors.VALIDATION_ERROR(`Maximal ${MAX_LINKS} Links erlaubt`)
      );
    }

    // 5. Upsert Profile & Replace Links (atomic transaction)
    const result = await db.transaction(async (tx) => {
      let profileId: number;
      
      const currentProfile = await tx.query.bioProfiles.findFirst({
        where: eq(bioProfiles.userId, auth.userId),
      });

      if (currentProfile) {
        await tx.update(bioProfiles)
          .set({ username, displayName, bio, updatedAt: new Date() })
          .where(eq(bioProfiles.id, currentProfile.id));
        profileId = currentProfile.id;
      } else {
        const [newProfile] = await tx.insert(bioProfiles)
          .values({ userId: auth.userId, username, displayName, bio })
          .returning();
        profileId = newProfile.id;
      }

      // Replace links (delete all, insert new)
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

    return secureResponse({ success: true, profileId: result });

  } catch (error) {
    return handleApiError(error, 'bio/POST');
  }
}
