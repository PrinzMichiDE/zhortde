/**
 * Pure tracking-pixel helpers.
 *
 * This module must stay free of database / Node-only imports so it can be
 * bundled into client components (the mask page fires pixels in the browser).
 * The DB access lives in `lib/tracking-pixels.ts`.
 */

export type TrackingPixel = {
  id: number;
  pixelType: 'facebook' | 'google' | 'custom';
  pixelId: string;
  events: string[];
  isActive: boolean;
};

/**
 * Parse the stored JSON events array defensively.
 */
export function parsePixelEvents(events: string | null): string[] {
  if (!events) return ['pageview'];
  try {
    const parsed: unknown = JSON.parse(events);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
      ? parsed as string[]
      : ['pageview'];
  } catch {
    return ['pageview'];
  }
}

/**
 * Validate a pixel identifier. Restricts the value to digits, letters,
 * underscores and hyphens to prevent injection into generated HTML.
 */
export function isValidPixelId(pixelId: string): boolean {
  if (!pixelId || pixelId.length > 80) return false;
  return /^[a-zA-Z0-9_-]{1,80}$/.test(pixelId);
}

/**
 * Build the HTML snippet that fires a single tracking pixel.
 */
export function buildPixelSnippet(pixel: TrackingPixel): string {
  switch (pixel.pixelType) {
    case 'facebook': {
      if (!isValidPixelId(pixel.pixelId)) {
        return '';
      }
      const events = pixel.events.includes('conversion')
        ? '\n        fbq("track", "Lead");'
        : '';
      return `<!-- Zhort Facebook Pixel (${pixel.pixelId}) -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,"script","https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", "${pixel.pixelId}");
  fbq("track", "PageView");${events}
</script>`;
    }

    case 'google': {
      if (!isValidPixelId(pixel.pixelId)) {
        return '';
      }
      return `<!-- Zhort Google Analytics 4 (${pixel.pixelId}) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixel.pixelId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", "${pixel.pixelId}");
</script>`;
    }

    case 'custom': {
      // Custom pixels are tracking-image URLs; only allow http(s)
      try {
        const parsed = new URL(pixel.pixelId);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return '';
        }
        return `<!-- Zhort Custom Tracking Pixel -->
<img src="${parsed.toString()}" width="1" height="1" alt="" referrerpolicy="no-referrer" />`;
      } catch {
        return '';
      }
    }

    default:
      return '';
  }
}

/**
 * Build the combined snippet for a list of pixels.
 */
export function buildPixelsSnippet(pixels: TrackingPixel[]): string {
  return pixels.map(buildPixelSnippet).filter(Boolean).join('\n');
}