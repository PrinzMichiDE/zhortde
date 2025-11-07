import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { PasteDisplay } from '@/components/paste-display';
import { isExpired } from '@/lib/password-protection';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ password?: string }>;
}

export default async function PastePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { password } = await searchParams;
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

  // Check password protection
  if (paste.passwordHash && !password) {
    redirect(`/protected/paste/${slug}`);
  }

  // Prüfe, ob der Benutzer Zugriff hat
  if (!paste.isPublic) {
    if (!session || paste.userId !== parseInt(session.user.id)) {
      notFound();
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

