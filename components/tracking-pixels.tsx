'use client';

import { useEffect, useRef } from 'react';
import { buildPixelsSnippet, type TrackingPixel } from '@/lib/pixel-snippets';

/**
 * Fires the tracking pixels configured for a masked link.
 *
 * Scripts injected through `innerHTML` do not execute by themselves, so the
 * script tags are re-inserted once the snippet is in the DOM. Image pixels
 * load automatically.
 */
export function TrackingPixels({ pixels }: { pixels: TrackingPixel[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelSource = buildPixelsSnippet(pixels);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || pixels.length === 0) return;

    container.innerHTML = pixelSource;

    container.querySelectorAll('script').forEach((oldScript) => {
      const newScript = document.createElement('script');
      for (const attr of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.text = oldScript.text;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [pixelSource, pixels.length]);

  if (pixels.length === 0) {
    return null;
  }

  return <div ref={containerRef} aria-hidden="true" className="hidden" />;
}