import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { isRtlLocale, type Locale } from '@/i18n/config';
import { getBaseUrl } from '@/lib/env';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('metadata');
  const baseUrl = new URL(getBaseUrl());

  return {
    metadataBase: baseUrl,
    title: {
      default: t('title'),
      template: `%s | Zhort`,
    },
    description: t('description'),
    applicationName: 'Zhort',
    generator: 'Next.js',
    keywords: [
      'URL shortener',
      'link shortener',
      'short link',
      'Pastebin',
      'share code snippets',
      'QR code',
      'link analytics',
      'API',
      'MCP',
      'Model Context Protocol',
      'link in bio',
    ],
    referrer: 'strict-origin-when-cross-origin',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      url: baseUrl,
      siteName: 'Zhort',
      title: t('title'),
      description: t('description'),
      locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale() as Locale;
  const messages = await getMessages();
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  const baseUrl = getBaseUrl();

  const jsonLdWebsite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zhort',
    url: baseUrl,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const jsonLdOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zhort',
    url: baseUrl,
    sameAs: [
      'https://www.michelfritzsch.de',
    ],
  };

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground flex flex-col min-h-screen transition-colors duration-300`}>
        <Providers locale={locale} messages={messages}>
          <script
            type="application/ld+json"
            // JSON-LD must be inline per spec; CSP currently allows inline scripts.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
          />
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
