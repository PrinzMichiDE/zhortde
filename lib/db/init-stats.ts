import { db } from './index';
import { stats } from './schema';
import { eq, sql } from 'drizzle-orm';
import { getInitialStat, INITIAL_STATS, LEGACY_IDENTICAL_SEED, type StatKey } from '@/lib/stats-config';
import { isMissingRelationError } from '@/lib/db/errors';

export { INITIAL_STATS, getInitialStat };

let statsTableReady = false;

const CREATE_STATS_TABLE_SQL = sql`
  CREATE TABLE "stats" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" text NOT NULL,
    "value" integer NOT NULL,
    CONSTRAINT "stats_key_unique" UNIQUE("key")
  )
`;

async function statsTableExists(): Promise<boolean> {
  const rows = await db.execute(sql`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'stats'
    LIMIT 1
  `);

  return rows.length > 0;
}

async function ensureStatsTable(): Promise<boolean> {
  if (statsTableReady) {
    return true;
  }

  try {
    if (await statsTableExists()) {
      statsTableReady = true;
      return true;
    }

    await db.execute(CREATE_STATS_TABLE_SQL);
    statsTableReady = true;
    return true;
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn('Stats table missing and could not be created automatically.');
    } else {
      console.error('Error ensuring stats table:', error);
    }
    return false;
  }
}

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
    const ready = await ensureStatsTable();
    if (!ready) {
      return;
    }

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
      statsTableReady = false;
      const recreated = await ensureStatsTable();
      if (recreated) {
        await initStats();
      }
      return;
    }
    console.error('Error initializing stats:', error);
  }
}

export async function incrementStat(key: string, retry = true): Promise<number> {
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
    if (retry && isMissingRelationError(error)) {
      statsTableReady = false;
      if (await ensureStatsTable()) {
        return incrementStat(key, false);
      }
    }
    console.error(`Error incrementing stat ${key}:`, error);
    return fallback;
  }
}

export async function getStat(key: string, retry = true): Promise<number> {
  const fallback = getInitialStat(key);

  try {
    await initStats();

    const stat = await db.query.stats.findFirst({
      where: eq(stats.key, key),
    });

    return stat?.value ?? fallback;
  } catch (error) {
    if (retry && isMissingRelationError(error)) {
      statsTableReady = false;
      if (await ensureStatsTable()) {
        return getStat(key, false);
      }
    }
    console.error(`Error getting stat ${key}:`, error);
    return fallback;
  }
}
