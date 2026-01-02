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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('dashboard');

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);

  // Load user's links
  const userLinks = await db.query.links.findMany({
    where: eq(links.userId, userId),
    orderBy: [desc(links.createdAt)],
  });

  // Load user's pastes
  const userPastes = await db.query.pastes.findMany({
    where: eq(pastes.userId, userId),
    orderBy: [desc(pastes.createdAt)],
  });

  const features = [
    { name: t('bulkShorten'), href: '/dashboard/bulk', icon: '📦', description: t('bulkDescription'), color: 'from-blue-500 to-cyan-500' },
    { name: 'Password Sharing', href: '/passwords/create', icon: '🔐', description: 'End-to-end encrypted password sharing', color: 'from-green-500 to-emerald-500' },
    { name: 'P2P File Sharing', href: '/p2p/create', icon: '🌐', description: 'Peer-to-peer file transfer without server storage', color: 'from-purple-500 to-pink-500' },
    { name: t('apiKeys'), href: '/dashboard/api-keys', icon: '🔑', description: t('apiKeysDescription'), color: 'from-amber-500 to-orange-500' },
    { name: t('webhooks'), href: '/dashboard/webhooks', icon: '🔔', description: t('webhooksDescription'), color: 'from-pink-500 to-rose-500' },
    { name: t('teams'), href: '/dashboard/teams', icon: '👥', description: t('teamsDescription'), color: 'from-purple-500 to-indigo-500' },
    { name: t('integrations'), href: '/dashboard/integrations', icon: '🤖', description: t('integrationsDescription'), color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            {t('title')}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 flex items-center gap-2 flex-wrap">
            <span>{t('welcomeBack')}</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{session.user.email}</span>
            <span className="inline-block animate-wave">👋</span>
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12 animate-slide-up">
          {features.map((feature, idx) => (
            <Link 
              key={feature.name} 
              href={feature.href}
              className="group relative overflow-hidden bg-white dark:bg-gray-800/90 p-6 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-800 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] block backdrop-blur-sm"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="mb-4 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl w-fit">
                  <span className="text-2xl block">{feature.icon}</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{feature.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <span className="text-2xl block" aria-hidden="true">🔗</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {t('myLinks')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your shortened URLs</p>
                </div>
              </div>
              <div className="px-5 py-2.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full border border-indigo-200 dark:border-indigo-800">
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  {userLinks.length} {userLinks.length === 1 ? t('link') : t('links')}
                </span>
              </div>
            </div>
            <LinksList links={userLinks} />
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <span className="text-2xl block" aria-hidden="true">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {t('myPastes')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your code snippets and pastes</p>
                </div>
              </div>
              <div className="px-5 py-2.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full border border-green-200 dark:border-green-800">
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  {userPastes.length} {userPastes.length === 1 ? t('paste') : t('pastes')}
                </span>
              </div>
            </div>
            <PastesList pastes={userPastes} />
          </div>
        </div>
      </div>
    </div>
  );
}
