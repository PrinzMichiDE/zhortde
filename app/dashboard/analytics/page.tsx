import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { PageContainer, PageShell, Surface } from '@/components/layout/section';
import Link from 'next/link';
import { ChartBarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default async function DashboardAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('dashboard');

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);
  const userLinks = await db.query.links.findMany({
    where: eq(links.userId, userId),
    orderBy: [desc(links.hits)],
  });

  return (
    <PageShell>
      <PageContainer className="py-8 sm:py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            {t('analytics')}
          </h1>
          <p className="text-muted-foreground">{t('analyticsPageDescription')}</p>
        </header>

        <Surface elevated className="p-6 sm:p-8">
          {userLinks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('noLinks')}</p>
              <Link href="/" className="mt-4 inline-block text-primary font-medium hover:underline">
                {t('createFirstLink')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {userLinks.map((link) => (
                <li key={link.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-primary">{link.shortCode}</p>
                    <p className="truncate text-sm text-muted-foreground" title={link.longUrl}>
                      {link.longUrl}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {link.hits.toLocaleString()} {t('clicks')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/dashboard/analytics/${link.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
                      {t('viewAnalytics')}
                    </Link>
                    <a
                      href={`/s/${link.shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                      {t('view')}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </PageContainer>
    </PageShell>
  );
}
