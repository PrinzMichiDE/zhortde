import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { bioProfiles, bioLinks } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ username: string }>;
};

// Generate Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  const profile = await db.query.bioProfiles.findFirst({
    where: eq(bioProfiles.username, username),
  });
  
  if (!profile) return { title: 'Zhort Bio' };

  return {
    title: `${profile.displayName || username} | Zhort Bio`,
    description: profile.bio || `Check out ${username}'s links on Zhort.`,
  };
}

export default async function BioPage({ params }: Props) {
  const { username } = await params;

  // Fetch real data
  const profile = await db.query.bioProfiles.findFirst({
    where: eq(bioProfiles.username, username),
    with: {
      links: {
        orderBy: [asc(bioLinks.position)],
      }
    }
  });

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-xl border-4 border-white dark:border-gray-800 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName || username} className="w-full h-full object-cover" />
            ) : (
              (profile.displayName || username).charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {profile.displayName || username}
            </h1>
            {profile.bio && (
              <p className="text-gray-600 dark:text-gray-300">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Links List */}
        <div className="space-y-4">
          {profile.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 text-center font-semibold text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 group"
            >
              {link.title}
              <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-widest"
          >
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Powered by Zhort
          </Link>
        </div>

      </div>
    </div>
  );
}
