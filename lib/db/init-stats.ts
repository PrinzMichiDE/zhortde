import { db } from './index';
import { stats } from './schema';
import { eq } from 'drizzle-orm';
import { getInitialStat, INITIAL_STATS, type StatKey } from '@/lib/stats-config';

export { INITIAL_STATS, getInitialStat };

export async function initStats() {
  try {
    for (const key of Object.keys(INITIAL_STATS) as StatKey[]) {
      const existing = await db.query.stats.findFirst({
        where: eq(stats.key, key),
      });

      if (!existing) {
        await db.insert(stats).values({
          key,
          value: INITIAL_STATS[key],
        });
        console.log(`Initialized ${key} counter to ${INITIAL_STATS[key]}`);
      }
    }
  } catch (error) {
    console.error('Error initializing stats:', error);
  }
}

export async function incrementStat(key: string): Promise<number> {
  const fallback = getInitialStat(key);

  try {
    await initStats();

    const stat = await db.query.stats.findFirst({
      where: eq(stats.key, key),
    });

    if (!stat) {
      const nextValue = fallback + 1;
      await db.insert(stats).values({ key, value: nextValue });
      return nextValue;
    }

    const newValue = stat.value + 1;
    await db.update(stats)
      .set({ value: newValue })
      .where(eq(stats.key, key));

    return newValue;
  } catch (error) {
    console.error(`Error incrementing stat ${key}:`, error);
    return fallback;
  }
}

export async function getStat(key: string): Promise<number> {
  const fallback = getInitialStat(key);

  try {
    await initStats();

    const stat = await db.query.stats.findFirst({
      where: eq(stats.key, key),
    });

    return stat?.value ?? fallback;
  } catch (error) {
    console.error(`Error getting stat ${key}:`, error);
    return fallback;
  }
}
