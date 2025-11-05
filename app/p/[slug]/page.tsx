import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { PasteDisplay } from '@/components/paste-display';

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
    />
  );
}

