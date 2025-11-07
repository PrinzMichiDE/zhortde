'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MaskedLinkPage() {
  const params = useParams();
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [splashHtml, setSplashHtml] = useState<string>('');
  const [splashDuration, setSplashDuration] = useState(3000);

  useEffect(() => {
    // Fetch link details and masking config
    async function fetchLinkData() {
      try {
        const res = await fetch(`/api/mask-config/${params.shortCode}`);
        const data = await res.json();

        if (!data.targetUrl) {
          router.push('/404');
          return;
        }

        setTargetUrl(data.targetUrl);
        setSplashHtml(data.splashHtml || '');
        setSplashDuration(data.splashDuration || 3000);

        // Auto-hide splash after duration
        if (data.enableSplash) {
          setTimeout(() => {
            setShowSplash(false);
          }, data.splashDuration);
        } else {
          setShowSplash(false);
        }
      } catch (error) {
        console.error('Failed to load link:', error);
        router.push('/404');
      }
    }

    fetchLinkData();
  }, [params.shortCode, router]);

  if (showSplash && splashHtml) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: splashHtml }}
      />
    );
  }

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="text-center text-white">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!targetUrl) {
    return null;
  }

  // Iframe mode (frame-based cloaking)
  return (
    <iframe
      src={targetUrl}
      className="w-full h-screen border-0"
      title="Masked Content"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
    />
  );
}

