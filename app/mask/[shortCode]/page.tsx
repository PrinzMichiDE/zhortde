'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { TrackingPixels } from '@/components/tracking-pixels';
import type { TrackingPixel } from '@/lib/tracking-pixels';

type MaskConfig = {
  inactive: boolean;
  fallbackUrl: string | null;
  targetUrl: string | null;
  enableFrame: boolean;
  enableSplash: boolean;
  splashHtml: string;
  splashDuration: number;
  pixels: TrackingPixel[];
};

export default function MaskedLinkPage() {
  const params = useParams();
  const router = useRouter();
  const [config, setConfig] = useState<MaskConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Fetch link details and masking config
    async function fetchLinkData() {
      try {
        const res = await fetch(`/api/mask-config/${params.shortCode}`);
        const data: MaskConfig = await res.json();

        if (!data.targetUrl && !data.inactive) {
          router.push('/404');
          return;
        }

        setConfig(data);

        // Inactive schedule: go to fallback or stay hidden
        if (data.inactive) {
          if (data.fallbackUrl) {
            window.location.href = data.fallbackUrl;
          }
          return;
        }

        // Auto-hide splash after duration
        if (data.enableSplash) {
          setTimeout(() => {
            setShowSplash(false);
          }, data.splashDuration || 3000);
        } else {
          setShowSplash(false);
        }
      } catch (error) {
        console.error('Failed to load link:', error);
        router.push('/404');
      } finally {
        setLoaded(true);
      }
    }

    fetchLinkData();
  }, [params.shortCode, router]);

  // Handle redirects for non-iframe masking (Splash only)
  useEffect(() => {
    if (!showSplash && !config?.enableFrame && config?.targetUrl) {
      window.location.href = config.targetUrl;
    }
  }, [showSplash, config]);

  if (config?.inactive && !config.fallbackUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <p className="text-xl font-semibold text-foreground">Dieser Link ist derzeit nicht aktiv</p>
          <p className="mt-2 text-sm">Bitte versuchen Sie es später erneut.</p>
        </div>
      </div>
    );
  }

  if (!config || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { splashHtml, enableFrame, targetUrl } = config;

  // Always fire tracking pixels once the link is reachable
  const pixels = config.pixels.length > 0 ? <TrackingPixels pixels={config.pixels} /> : null;

  if (showSplash && splashHtml) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: splashHtml }}
      >
        {pixels}
      </div>
    );
  }

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="text-center text-white">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Wird geladen...</p>
        </div>
        {pixels}
      </div>
    );
  }

  if (!enableFrame && targetUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
        {pixels}
      </div>
    );
  }

  if (!targetUrl) {
    return null;
  }

  // Iframe mode (frame-based cloaking)
  return (
    <>
      <iframe
        src={targetUrl}
        className="w-full h-screen border-0"
        title="Masked Content"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
      {pixels}
    </>
  );
}