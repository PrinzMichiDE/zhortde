import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, pastes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LinksList } from '@/components/dashboard/links-list';
import { PastesList } from '@/components/dashboard/pastes-list';

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
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

