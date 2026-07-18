import dynamic from 'next/dynamic';
import { LinkForm } from '@/components/link-form';
import { getStat } from '@/lib/db/init-stats';
import { getTranslations, getLocale } from 'next-intl/server';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeFeatures } from '@/components/home/home-features';

const KofiSupport = dynamic(
  () => import('@/components/kofi-support').then((m) => ({ default: m.KofiSupport })),
  {
    loading: () => <Skeleton className="h-32 w-full rounded-2xl" />,
  }
);

// Cache stats for 60s — avoids force-dynamic on every request
export const revalidate = 60;

export default async function Home() {
  const [visitorCount, linkCount, t, tf, locale] = await Promise.all([
    getStat('visitors'),
    getStat('links'),
    getTranslations('home'),
    getTranslations('features'),
    getLocale(),
  ]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* Static background — lighter than animated blobs for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300/20 dark:bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="pt-16 pb-12 sm:pt-20 sm:pb-16">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-2 border-indigo-200 dark:border-indigo-800 rounded-full shadow-lg">
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {t('badge')}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                {t('title1')}
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400">
                {t('title2')}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
              {t('subtitle')}{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{t('subtitleHighlight')}</span>{' '}
              {t('subtitleEnd')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2.5 bg-white/90 dark:bg-gray-800/90 px-4 py-2.5 rounded-xl backdrop-blur-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{linkCount.toLocaleString(locale)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('linksCreated')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/90 dark:bg-gray-800/90 px-4 py-2.5 rounded-xl backdrop-blur-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{visitorCount.toLocaleString(locale)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{t('visitors')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/90 dark:bg-gray-800/90 px-4 py-2.5 rounded-xl backdrop-blur-xl border border-green-200 dark:border-green-800 shadow-sm">
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100">{t('secure')}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">100% Secure</div>
                </div>
              </div>
            </div>
          </div>

          {/* Link Form — primary CTA above the fold */}
          <div className="max-w-3xl mx-auto mb-12">
            <LinkForm />
          </div>

          {/* Support Banner — lazy loaded */}
          <div className="max-w-6xl mx-auto mb-16 px-4">
            <KofiSupport variant="banner" showMonthly={true} />
          </div>
        </div>

        {/* Features — separate component for maintainability */}
        <HomeFeatures t={t} tf={tf} />

        {/* Support Section — lazy loaded */}
        <div className="max-w-5xl mx-auto mt-16 mb-16 px-4">
          <KofiSupport variant="full" showMonthly={true} />
        </div>
      </div>
    </div>
  );
}
