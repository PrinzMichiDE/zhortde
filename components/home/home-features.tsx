import dynamic from 'next/dynamic';
import {
  LockClosedIcon,
  ClockIcon,
  QrCodeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/skeleton';

const ExtensionDownload = dynamic(
  () => import('@/components/extension-download').then((m) => ({ default: m.ExtensionDownload })),
  { loading: () => <Skeleton className="h-24 w-full rounded-xl" /> }
);

interface HomeFeaturesProps {
  t: (key: string) => string;
  tf: (key: string) => string;
}

const features = [
  {
    key: 'passwordProtection',
    icon: LockClosedIcon,
    gradient: 'from-indigo-500 to-purple-600',
    hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    hoverShadow: 'hover:shadow-indigo-500/20',
    hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
    overlay: 'from-indigo-500/10 to-purple-500/10',
  },
  {
    key: 'expiration',
    icon: ClockIcon,
    gradient: 'from-green-500 to-emerald-600',
    hoverBorder: 'hover:border-green-300 dark:hover:border-green-700',
    hoverShadow: 'hover:shadow-green-500/20',
    hoverText: 'group-hover:text-green-600 dark:group-hover:text-green-400',
    overlay: 'from-green-500/10 to-emerald-500/10',
  },
  {
    key: 'qrCodes',
    icon: QrCodeIcon,
    gradient: 'from-blue-500 to-cyan-600',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    hoverShadow: 'hover:shadow-blue-500/20',
    hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    overlay: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    key: 'analytics',
    icon: ChartBarIcon,
    gradient: 'from-purple-500 to-pink-600',
    hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    hoverShadow: 'hover:shadow-purple-500/20',
    hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    overlay: 'from-purple-500/10 to-pink-500/10',
  },
  {
    key: 'bulkProcessing',
    icon: BoltIcon,
    gradient: 'from-orange-500 to-amber-600',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
    hoverShadow: 'hover:shadow-orange-500/20',
    hoverText: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
    overlay: 'from-orange-500/10 to-amber-500/10',
  },
  {
    key: 'enterprise',
    icon: ShieldCheckIcon,
    gradient: 'from-teal-500 to-cyan-600',
    hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-700',
    hoverShadow: 'hover:shadow-teal-500/20',
    hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    overlay: 'from-teal-500/10 to-cyan-500/10',
  },
] as const;

export function HomeFeatures({ t, tf }: HomeFeaturesProps) {
  return (
    <div className="pb-16" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 1200px' }}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-indigo-200 dark:border-indigo-800 rounded-full shadow-sm">
          <SparklesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {t('whyZhort')}
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-3">
          {t('whyZhort')}
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          {t('whyZhortSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {features.map(({ key, icon: Icon, gradient, hoverBorder, hoverShadow, hoverText, overlay }) => (
          <div
            key={key}
            className={`group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 ${hoverBorder} transition-base hover:shadow-xl ${hoverShadow} hover:-translate-y-1`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${overlay} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} aria-hidden="true" />
            <div className="relative">
              <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl mb-5 shadow-md`}>
                <Icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h3 className={`text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 ${hoverText} transition-colors`}>
                {tf(`${key}.title`)}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {tf(`${key}.description`)}
              </p>
            </div>
          </div>
        ))}

        {/* Browser Extension */}
        <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-base hover:shadow-xl md:col-span-2 lg:col-span-3">
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 w-full">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl mb-4 shadow-md">
                <GlobeAltIcon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <ExtensionDownload />
            </div>
            <div className="flex-1 w-full max-w-sm bg-gray-900 rounded-lg p-4 shadow-xl border border-gray-800" aria-hidden="true">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="flex-1 bg-gray-800 h-6 rounded px-2 text-xs flex items-center text-gray-400 ml-2">zhort.de</div>
              </div>
              <div className="bg-white rounded p-4 text-center">
                <div className="font-bold text-gray-900 mb-2">Zhort Extension</div>
                <div className="bg-indigo-600 text-white text-sm py-1 px-3 rounded w-full">Shorten</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
