import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, pastes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LinksList } from '@/components/dashboard/links-list';
import { PastesList } from '@/components/dashboard/pastes-list';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { PageContainer, PageShell, Surface } from '@/components/layout/section';

export default async function DashboardPage() {
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

  const userPastes = await db.query.pastes.findMany({
    where: eq(pastes.userId, userId),
    orderBy: [desc(pastes.createdAt)],
  });

  const features = [
    { name: t('bulkShorten'), href: '/dashboard/bulk', description: t('bulkDescription') },
    { name: 'Password Sharing', href: '/passwords/create', description: 'End-to-end encrypted password sharing' },
    { name: 'P2P File Sharing', href: '/p2p/create', description: 'Peer-to-peer file transfer without server storage' },
    { name: t('apiKeys'), href: '/dashboard/api-keys', description: t('apiKeysDescription') },
    { name: t('webhooks'), href: '/dashboard/webhooks', description: t('webhooksDescription') },
    { name: t('teams'), href: '/dashboard/teams', description: t('teamsDescription') },
    { name: t('integrations'), href: '/dashboard/integrations', description: t('integrationsDescription') },
  ];

  return (
    <PageShell>
      <PageContainer className="py-8 sm:py-10">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('welcomeBack')}{' '}
            <span className="font-medium text-foreground">{session.user.email}</span>
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {features.map((feature) => (
            <Link
              key={feature.name}
              href={feature.href}
              className="block rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-shadow"
            >
              <h3 className="font-semibold text-foreground mb-1.5">{feature.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </Link>
          ))}
        </div>

        <div className="space-y-8">
          <Surface elevated className="p-6 sm:p-8">
            <div className="panel-header">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('myLinks')}</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your shortened URLs</p>
              </div>
              <span className="panel-badge">
                {userLinks.length} {userLinks.length === 1 ? t('link') : t('links')}
              </span>
            </div>
            <LinksList links={userLinks} />
          </Surface>

          <Surface elevated className="p-6 sm:p-8">
            <div className="panel-header">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('myPastes')}</h2>
                <p className="text-sm text-muted-foreground mt-1">Your code snippets and pastes</p>
              </div>
              <span className="panel-badge">
                {userPastes.length} {userPastes.length === 1 ? t('paste') : t('pastes')}
              </span>
            </div>
            <PastesList pastes={userPastes} />
          </Surface>
        </div>
      </PageContainer>
    </PageShell>
  );
}
