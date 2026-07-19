import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { pastes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PastesList } from '@/components/dashboard/pastes-list';
import { getTranslations } from 'next-intl/server';
import { PageContainer, PageShell, Surface } from '@/components/layout/section';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default async function DashboardPastesPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('dashboard');

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);
  const userPastes = await db.query.pastes.findMany({
    where: eq(pastes.userId, userId),
    orderBy: [desc(pastes.createdAt)],
  });

  return (
    <PageShell>
      <PageContainer className="py-8 sm:py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
              {t('myPastes')}
            </h1>
            <p className="text-muted-foreground">{t('pastesPageDescription')}</p>
          </div>
          <Link href="/paste/create" className={cn(buttonVariants())}>
            {t('createNewPaste')}
          </Link>
        </header>

        <Surface elevated className="p-6 sm:p-8">
          <PastesList pastes={userPastes} />
        </Surface>
      </PageContainer>
    </PageShell>
  );
}
