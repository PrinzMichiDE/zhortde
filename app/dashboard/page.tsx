import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, pastes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LinksList } from '@/components/dashboard/links-list';
import { PastesList } from '@/components/dashboard/pastes-list';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);

  // Lade Links des Benutzers
  const userLinks = await db.query.links.findMany({
    where: eq(links.userId, userId),
    orderBy: [desc(links.createdAt)],
  });

  // Lade Pastes des Benutzers
  const userPastes = await db.query.pastes.findMany({
    where: eq(pastes.userId, userId),
    orderBy: [desc(pastes.createdAt)],
  });

  const features = [
    { name: 'Bulk Shorten', href: '/dashboard/bulk', icon: '📦', description: 'Viele Links auf einmal kürzen', color: 'from-blue-500 to-cyan-500' },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: '🔑', description: 'Zugriffsschlüssel verwalten', color: 'from-amber-500 to-orange-500' },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: '🔔', description: 'Event-Benachrichtigungen', color: 'from-pink-500 to-rose-500' },
    { name: 'Teams', href: '/dashboard/teams', icon: '👥', description: 'Teamarbeit und Kollaboration', color: 'from-purple-500 to-indigo-500' },
    { name: 'Integrations (MCP)', href: '/dashboard/integrations', icon: '🤖', description: 'AI Agenten verbinden', color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Dashboard
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 flex items-center gap-2 flex-wrap">
            <span>Willkommen zurück,</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{session.user.email}</span>
            <span className="inline-block animate-wave">👋</span>
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12 animate-slide-up">
          {features.map((feature, idx) => (
            <Link 
              key={feature.name} 
              href={feature.href}
              className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className="relative z-10">
                <span className="text-3xl mb-3 block">{feature.icon}</span>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{feature.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="space-y-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">🔗</span>
                Meine Links
              </h2>
              <div className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full">
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                  {userLinks.length} {userLinks.length === 1 ? 'Link' : 'Links'}
                </span>
              </div>
            </div>
            <LinksList links={userLinks} />
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">📋</span>
                Meine Pastes
              </h2>
              <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full">
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  {userPastes.length} {userPastes.length === 1 ? 'Paste' : 'Pastes'}
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
