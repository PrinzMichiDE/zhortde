'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LinkPreviewData {
  title?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  siteName?: string;
  faviconUrl?: string;
  ogData?: any;
}

interface LinkPreviewCardProps {
  linkId: number;
  longUrl: string;
  shortUrl: string;
  className?: string;
}

export function LinkPreviewCard({ linkId, longUrl, shortUrl, className = '' }: LinkPreviewCardProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const response = await fetch(`/api/links/${linkId}/preview`);
        const data = await response.json();
        if (data.success && data.preview) {
          setPreview(data.preview);
        }
      } catch (error) {
        console.error('Error fetching preview:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, [linkId]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🔗</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {new URL(longUrl).hostname}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
              {shortUrl}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      {preview.thumbnailUrl && (
        <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700">
          <Image
            src={preview.thumbnailUrl}
            alt={preview.title || 'Link preview'}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              // Hide image on error
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {preview.faviconUrl && (
            <div className="flex-shrink-0">
              <Image
                src={preview.faviconUrl}
                alt=""
                width={20}
                height={20}
                className="rounded"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {preview.siteName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {preview.siteName}
              </p>
            )}
            {preview.title && (
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                {preview.title}
              </h3>
            )}
            {preview.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {preview.description}
              </p>
            )}
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 truncate">
              {shortUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
