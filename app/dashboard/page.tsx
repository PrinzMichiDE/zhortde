import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { links, pastes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
    orderBy: (links, { desc }) => [desc(links.createdAt)],
  });

  // Lade Pastes des Benutzers
  const userPastes = await db.query.pastes.findMany({
    where: eq(pastes.userId, userId),
    orderBy: (pastes, { desc }) => [desc(pastes.createdAt)],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-lg text-gray-600">
          Willkommen zurück, {session.user.email}
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Meine Links</h2>
            <div className="text-sm text-gray-600">
              {userLinks.length} {userLinks.length === 1 ? 'Link' : 'Links'}
            </div>
          </div>
          <LinksList links={userLinks} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Meine Pastes</h2>
            <div className="text-sm text-gray-600">
              {userPastes.length} {userPastes.length === 1 ? 'Paste' : 'Pastes'}
            </div>
          </div>
          <PastesList pastes={userPastes} />
        </div>
      </div>
    </div>
  );
}

