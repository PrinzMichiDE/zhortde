import { db } from './db';
import { trackingPixels } from './db/schema';
import { eq } from 'drizzle-orm';
import { parsePixelEvents, type TrackingPixel } from './pixel-snippets';

export type { TrackingPixel } from './pixel-snippets';
export { parsePixelEvents, buildPixelSnippet, buildPixelsSnippet, isValidPixelId } from './pixel-snippets';

/**
 * Fetch all active tracking pixels configured for a link.
 */
export async function getActivePixels(linkId: number): Promise<TrackingPixel[]> {
  const pixels = await db.query.trackingPixels.findMany({
    where: eq(trackingPixels.linkId, linkId),
  });

  return pixels
    .filter((pixel) => pixel.isActive)
    .map((pixel) => ({
      id: pixel.id,
      pixelType: pixel.pixelType as TrackingPixel['pixelType'],
      pixelId: pixel.pixelId,
      events: parsePixelEvents(pixel.events),
      isActive: true,
    }));
}