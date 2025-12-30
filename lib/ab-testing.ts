import { db } from './db';
import { linkVariants, links } from './db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Select a variant for A/B testing based on traffic percentage
 */
export async function selectVariant(linkId: number): Promise<string | null> {
  const variants = await db.query.linkVariants.findMany({
    where: and(
      eq(linkVariants.linkId, linkId),
      eq(linkVariants.isWinner, false) // Only active variants
    ),
    orderBy: [linkVariants.trafficPercentage],
  });

  if (variants.length === 0) {
    return null; // No variants, use original link
  }

  // Calculate total traffic percentage
  const totalPercentage = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
  
  if (totalPercentage === 0) {
    return null;
  }

  // Generate random number 0-100
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += (variant.trafficPercentage / totalPercentage) * 100;
    if (random <= cumulative) {
      // Track click for this variant
      // Note: In production, use SQL increment: sql`clicks + 1`
      const updatedVariant = await db.query.linkVariants.findFirst({
        where: eq(linkVariants.id, variant.id),
      });
      if (updatedVariant) {
        await db
          .update(linkVariants)
          .set({ clicks: updatedVariant.clicks + 1 })
          .where(eq(linkVariants.id, variant.id));
      }
      
      return variant.variantUrl;
    }
  }

  // Fallback to first variant
  return variants[0]?.variantUrl || null;
}

/**
 * Track conversion for a variant
 */
export async function trackConversion(variantId: number) {
  const variant = await db.query.linkVariants.findFirst({
    where: eq(linkVariants.id, variantId),
  });
  if (variant) {
    await db
      .update(linkVariants)
      .set({ conversions: variant.conversions + 1 })
      .where(eq(linkVariants.id, variantId));
  }
}

/**
 * Get variants for a link
 */
export async function getLinkVariants(linkId: number) {
  return await db.query.linkVariants.findMany({
    where: eq(linkVariants.linkId, linkId),
  });
}

/**
 * Create a variant
 */
export async function createVariant(
  linkId: number,
  variantUrl: string,
  trafficPercentage: number
) {
  const [variant] = await db
    .insert(linkVariants)
    .values({
      linkId,
      variantUrl,
      trafficPercentage: Math.max(0, Math.min(100, trafficPercentage)),
      clicks: 0,
      conversions: 0,
      isWinner: false,
    })
    .returning();

  return variant;
}

/**
 * Set winner variant (auto-determine or manual)
 */
export async function setWinnerVariant(linkId: number, variantId?: number) {
  if (variantId) {
    // Manual selection
    // Clear all winners first
    await db
      .update(linkVariants)
      .set({ isWinner: false })
      .where(eq(linkVariants.linkId, linkId));
    
    // Set new winner
    await db
      .update(linkVariants)
      .set({ isWinner: true })
      .where(eq(linkVariants.id, variantId));
  } else {
    // Auto-determine based on conversion rate
    const variants = await getLinkVariants(linkId);
    
    if (variants.length === 0) return;

    // Calculate conversion rates
    const variantsWithRates = variants.map(v => ({
      ...v,
      conversionRate: v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0,
    }));

    // Find highest conversion rate
    const winner = variantsWithRates.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    // Update all variants
    await db
      .update(linkVariants)
      .set({ isWinner: false })
      .where(eq(linkVariants.linkId, linkId));
    
    await db
      .update(linkVariants)
      .set({ isWinner: true })
      .where(eq(linkVariants.id, winner.id));
  }
}

/**
 * Delete variant
 */
export async function deleteVariant(variantId: number) {
  await db
    .delete(linkVariants)
    .where(eq(linkVariants.id, variantId));
}
