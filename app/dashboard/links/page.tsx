import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LinksListEnhanced } from '@/components/dashboard/links-list-enhanced';
import { getTranslations } from 'next-intl/server';
import { PageContainer, PageShell, Surface } from '@/components/layout/section';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function DashboardLinksPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('dashboard');

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);
  const userLinks = await db.query.links.findMany({
    where: eq(links.userId, userId),
    orderBy: [desc(links.createdAt)],
  });

  return (
    <PageShell>
      <PageContainer className="py-8 sm:py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
              {t('myLinks')}
            </h1>
            <p className="text-muted-foreground">{t('linksPageDescription')}</p>
          </div>
          <Link href="/" className={cn(buttonVariants())}>
            {t('createNewLink')}
          </Link>
        </header>

        <Surface elevated className="p-6 sm:p-8">
          <LinksListEnhanced links={userLinks} />
        </Surface>
      </PageContainer>
    </PageShell>
  );
}
