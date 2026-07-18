import { db } from './index';
import { stats } from './schema';
import { eq } from 'drizzle-orm';
import { getInitialStat, INITIAL_STATS, LEGACY_IDENTICAL_SEED, type StatKey } from '@/lib/stats-config';
import { isMissingRelationError } from '@/lib/db/errors';

export { INITIAL_STATS, getInitialStat };

async function migrateLegacySeedStats(): Promise<void> {
  const [visitorStat, linksStat] = await Promise.all([
    db.query.stats.findFirst({ where: eq(stats.key, 'visitors') }),
    db.query.stats.findFirst({ where: eq(stats.key, 'links') }),
  ]);

  if (
    visitorStat?.value === LEGACY_IDENTICAL_SEED &&
    linksStat?.value === LEGACY_IDENTICAL_SEED
  ) {
    await Promise.all([
      db.update(stats)
        .set({ value: INITIAL_STATS.visitors })
        .where(eq(stats.key, 'visitors')),
      db.update(stats)
        .set({ value: INITIAL_STATS.links })
        .where(eq(stats.key, 'links')),
    ]);

    if (process.env.NODE_ENV === 'development') {
      console.log('Migrated legacy identical seed stats to plausible values');
    }
  }
}

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

        if (process.env.NODE_ENV === 'development') {
          console.log(`Initialized ${key} counter to ${INITIAL_STATS[key]}`);
        }
      }
    }

    await migrateLegacySeedStats();
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn('Stats table not ready yet; schema bootstrap may still be running.');
      return;
    }
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
