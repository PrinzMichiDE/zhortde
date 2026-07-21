import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { PasteDisplay } from '@/components/paste-display';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import {
  PASTE_ACCESS_COOKIE,
  verifyPasteAccessToken,
} from '@/lib/paste-access';
import { isExpired } from '@/lib/password-protection';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PastePage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  const paste = await db.query.pastes.findFirst({
    where: eq(pastes.slug, slug),
  });

  if (!paste) {
    notFound();
  }

  // Check if expired
  if (paste.expiresAt && isExpired(paste.expiresAt)) {
    notFound(); // Or show custom "expired" message
  }

  // Prüfe, ob der Benutzer Zugriff hat
  if (!paste.isPublic) {
    if (!session || paste.userId !== parseInt(session.user.id)) {
      notFound();
    }
  }

  if (paste.passwordHash) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(PASTE_ACCESS_COOKIE)?.value;

    if (!verifyPasteAccessToken(accessToken, slug, paste.passwordHash)) {
      redirect(`/protected/paste/${encodeURIComponent(slug)}`);
    }
  }

  return (
    <PasteDisplay
      slug={slug}
      content={paste.content}
      syntaxHighlightingLanguage={paste.syntaxHighlightingLanguage}
      isPublic={paste.isPublic}
      createdAt={paste.createdAt}
      expiresAt={paste.expiresAt}
      hasPassword={!!paste.passwordHash}
    />
  );
}

