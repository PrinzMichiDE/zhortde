import { LinkForm } from '@/components/link-form';
import { ExtensionDownload } from '@/components/extension-download';
import { KofiSupport } from '@/components/kofi-support';
import { FeatureCard } from '@/components/ui/feature-card';
import { StatChip } from '@/components/ui/stat-chip';
import {
  PageContainer,
  PageShell,
  Section,
  SectionHeader,
  Surface,
} from '@/components/layout/section';
import {
  LockClosedIcon,
  ClockIcon,
  QrCodeIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  LinkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { getStat } from '@/lib/db/init-stats';
import { getTranslations, getLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

const FEATURE_ICONS = [
  LockClosedIcon,
  ClockIcon,
  QrCodeIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
] as const;

const FEATURE_KEYS = [
  'passwordProtection',
  'expiration',
  'qrCodes',
  'analytics',
  'bulkProcessing',
  'enterprise',
] as const;

export default async function Home() {
  const visitorCount = await getStat('visitors');
  const linkCount = await getStat('links');
  const t = await getTranslations('home');
  const tf = await getTranslations('features');
  const locale = await getLocale();

  const features = FEATURE_KEYS.map((key, index) => ({
    key,
    icon: FEATURE_ICONS[index],
    title: tf(`${key}.title`),
    description: tf(`${key}.description`),
  }));

  return (
    <PageShell>
      <PageContainer>
        {/* Hero */}
        <Section className="pt-16 pb-10 sm:pt-20 sm:pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">
              {t('badge')}
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-5">
              {t('title1')}
              <span className="block text-primary">{t('title2')}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {t('subtitle')}{' '}
              <span className="font-medium text-foreground">{t('subtitleHighlight')}</span>{' '}
              {t('subtitleEnd')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
              <StatChip
                icon={LinkIcon}
                value={linkCount.toLocaleString(locale)}
                label={t('linksCreated')}
              />
              <StatChip
                icon={UserGroupIcon}
                value={visitorCount.toLocaleString(locale)}
                label={t('visitors')}
              />
              <StatChip icon={ShieldCheckIcon} value={t('secure')} label="100% Secure" />
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-12">
            <LinkForm />
          </div>

          <div className="max-w-4xl mx-auto">
            <KofiSupport variant="banner" showMonthly={true} />
          </div>
        </Section>

        {/* Features */}
        <Section className="border-t border-border">
          <SectionHeader
            eyebrow={t('whyZhort')}
            title={t('whyZhort')}
            description={t('whyZhortSubtitle')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard
                key={feature.key}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>

          {/* Extension */}
          <Surface elevated className="mt-8 p-6 sm:p-8 md:col-span-full">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-1 min-w-0">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <GlobeAltIcon className="h-5 w-5" aria-hidden />
                </div>
                <ExtensionDownload />
              </div>
              <div className="w-full max-w-sm shrink-0 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <div className="flex-1 bg-muted h-5 rounded text-[10px] flex items-center px-2 text-muted-foreground ml-1">
                    zhort.de
                  </div>
                </div>
                <div className="rounded-md border border-border bg-card p-4 text-center">
                  <p className="font-semibold text-foreground text-sm mb-2">Zhort Extension</p>
                  <button
                    type="button"
                    className="bg-primary text-primary-foreground text-sm py-1.5 px-3 rounded-md w-full"
                    tabIndex={-1}
                  >
                    Shorten
                  </button>
                </div>
              </div>
            </div>
          </Surface>

          <div className="max-w-4xl mx-auto mt-16">
            <KofiSupport variant="full" showMonthly={true} />
          </div>
        </Section>
      </PageContainer>
    </PageShell>
  );
}
