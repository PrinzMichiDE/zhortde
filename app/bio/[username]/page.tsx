import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { bioProfiles, bioLinks } from '@/lib/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';

type Props = {
  params: Promise<{ username: string }>;
};

type BioCustomColors = {
  bg?: string;
  text?: string;
  button?: string;
  buttonText?: string;
};

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// Generate Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  
  const profile = await db.query.bioProfiles.findFirst({
    where: and(eq(bioProfiles.username, username), eq(bioProfiles.isActive, true)),
  });
  
  if (!profile) return { title: 'Zhort Bio' };

  return {
    title: `${profile.displayName || username} | Zhort Bio`,
    description: profile.bio || `Check out ${username}'s links on Zhort.`,
    openGraph: {
      title: `${profile.displayName || username} | Zhort Bio`,
      description: profile.bio || `Check out ${username}'s links on Zhort.`,
      images: profile.avatarUrl ? [profile.avatarUrl] : undefined,
      type: 'profile',
      username,
    },
  };
}

export default async function BioPage({ params }: Props) {
  const { username } = await params;

  // Fetch real data
  const profile = await db.query.bioProfiles.findFirst({
    where: and(eq(bioProfiles.username, username), eq(bioProfiles.isActive, true)),
    with: {
      links: {
        where: eq(bioLinks.isActive, true),
        orderBy: [asc(bioLinks.position)],
      }
    }
  });

  if (!profile) {
    notFound();
  }

  const theme = profile.theme || 'light';
  const customColors = safeJsonParse<BioCustomColors>(profile.customColors);

  const colors =
    theme === 'custom' && customColors
      ? {
          bg: customColors.bg || '#ffffff',
          text: customColors.text || '#0f172a',
          buttonBg: customColors.button || '#ffffff',
          buttonText: customColors.buttonText || '#0f172a',
          avatarRing: 'rgba(15, 23, 42, 0.10)',
          buttonBorder: 'rgba(15, 23, 42, 0.12)',
          buttonHoverBg: 'rgba(15, 23, 42, 0.06)',
        }
      : theme === 'dark'
        ? {
            bg: '#020617',
            text: '#ffffff',
            buttonBg: '#0b1220',
            buttonText: '#ffffff',
            avatarRing: 'rgba(148, 163, 184, 0.18)',
            buttonBorder: 'rgba(148, 163, 184, 0.18)',
            buttonHoverBg: '#111a2d',
          }
        : {
            bg: '#ffffff',
            text: '#0f172a',
            buttonBg: '#ffffff',
            buttonText: '#0f172a',
            avatarRing: 'rgba(15, 23, 42, 0.10)',
            buttonBorder: 'rgba(15, 23, 42, 0.12)',
            buttonHoverBg: 'rgba(15, 23, 42, 0.06)',
          };

  const pageStyle = {
    '--bio-bg': colors.bg,
    '--bio-text': colors.text,
    '--bio-button-bg': colors.buttonBg,
    '--bio-button-text': colors.buttonText,
    '--bio-avatar-ring': colors.avatarRing,
    '--bio-button-border': colors.buttonBorder,
    '--bio-button-hover-bg': colors.buttonHoverBg,
  } as unknown as CSSProperties;

  return (
    <div
      style={pageStyle}
      className="min-h-screen bg-[var(--bio-bg)] text-[var(--bio-text)]"
    >
      <div className="mx-auto max-w-md px-6 pb-10 pt-14 min-h-screen flex flex-col items-center">
        {/* Profile */}
        <div className="w-full flex flex-col items-center text-center">
          <div className="mb-4">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName || username}
                width={96}
                height={96}
                priority
                className="h-24 w-24 rounded-full object-cover ring-4 ring-[color:var(--bio-avatar-ring)] shadow-sm"
              />
            ) : (
              <div className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 shadow-sm bg-gray-100 text-gray-500 border-white">
                {(profile.displayName || username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 className="font-bold text-xl mb-1 text-center px-2">
            {profile.displayName || username}
          </h1>
          {profile.bio && (
            <p className="text-center text-sm mb-8 px-2 leading-relaxed opacity-80">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="w-full space-y-3 mb-10">
          {profile.links.map((link) => (
            <a
              key={link.id}
              href={`/bio/${encodeURIComponent(username)}/l/${link.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl text-center font-medium border shadow-sm transition-all transform hover:scale-[1.02] min-h-[44px] px-4 py-3 bg-[var(--bio-button-bg)] text-[var(--bio-button-text)] border-[color:var(--bio-button-border)] hover:bg-[var(--bio-button-hover-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
              aria-label={link.title}
            >
              {link.title}
            </a>
          ))}

          {profile.links.length === 0 && (
            <div className="w-full p-4 rounded-xl text-center border border-dashed opacity-50">
              No links yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 pb-4">
          <Link
            href="/"
            className="text-[10px] font-medium px-2 py-1 rounded-full bg-[var(--bio-button-hover-bg)] hover:opacity-90 transition-opacity"
          >
            zhort.de
          </Link>
        </div>
      </div>
    </div>
  );
}
