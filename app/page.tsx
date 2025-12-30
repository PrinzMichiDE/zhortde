import { LinkForm } from '@/components/link-form';
import { ExtensionDownload } from '@/components/extension-download';
import { 
  LockClosedIcon, 
  ClockIcon, 
  QrCodeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  SparklesIcon,
  UserGroupIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { getStat } from '@/lib/db/init-stats';
import { getTranslations, getLocale } from 'next-intl/server';

// Ensure dynamic rendering to fetch fresh stats
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch real statistics
  const visitorCount = await getStat('visitors');
  const linkCount = await getStat('links');
  const t = await getTranslations('home');
  const tf = await getTranslations('features');
  const locale = await getLocale();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="pt-20 pb-16 sm:pt-24 sm:pb-20">
          <div className="text-center mb-16 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/50 rounded-full shadow-sm">
              <SparklesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {t('badge')}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 animate-gradient bg-[length:200%_auto]">
                {t('title1')}
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400 animate-gradient bg-[length:200%_auto] animation-delay-1000">
                {t('title2')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8 font-light">
              {t('subtitle')}{' '}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{t('subtitleHighlight')}</span>{' '}
              {t('subtitleEnd')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <LinkIcon className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold">{linkCount.toLocaleString(locale)} {t('linksCreated')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <UserGroupIcon className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">{visitorCount.toLocaleString(locale)} {t('whyZhortSubtitle').includes('Visitor') ? 'Visitors' : 'Besucher'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                <span className="font-semibold">{t('secure')}</span>
              </div>
            </div>
          </div>

          {/* Link Form */}
          <div className="max-w-3xl mx-auto mb-20">
            <LinkForm />
          </div>
        </div>

        {/* Features Section */}
        <div className="pb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('whyZhort')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('whyZhortSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
                  <LockClosedIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tf('passwordProtection.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tf('passwordProtection.description')}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-green-500/25">
                  <ClockIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {tf('expiration.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tf('expiration.description')}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                  <QrCodeIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tf('qrCodes.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tf('qrCodes.description')}
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                  <ChartBarIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {tf('analytics.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tf('analytics.description')}
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-orange-500/25">
                  <BoltIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {tf('bulkProcessing.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tf('bulkProcessing.description')}
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-teal-500/25">
                  <ShieldCheckIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {tf('enterprise.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {tf('enterprise.description')}
                </p>
              </div>
            </div>

            {/* Feature 7 - Browser Extension */}
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 md:col-span-2 lg:col-span-3">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-indigo-500/25">
                    <GlobeAltIcon className="h-7 w-7 text-white" />
                  </div>
                  
                  {/* Client Component: Extension Download Button with Browser Detection */}
                  <ExtensionDownload />

                </div>
                <div className="flex-1 w-full max-w-sm bg-gray-900 rounded-lg p-4 shadow-xl border border-gray-800">
                  <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="flex-1 bg-gray-800 h-6 rounded px-2 text-xs flex items-center text-gray-400 ml-2">zhort.de</div>
                  </div>
                  <div className="bg-white rounded p-4 text-center">
                    <div className="font-bold text-gray-900 mb-2">Zhort Extension</div>
                    <button className="bg-indigo-600 text-white text-sm py-1 px-3 rounded w-full hover:bg-indigo-700 transition-colors">Shorten</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
