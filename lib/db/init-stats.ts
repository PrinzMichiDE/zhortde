import { db } from './index';
import { stats } from './schema';
import { eq } from 'drizzle-orm';

const INITIAL_VALUES = {
  visitors: 126819,
  links: 126819,
};

export async function initStats() {
  try {
    // Prüfe und initialisiere Besucher-Counter
    const visitorStat = await db.query.stats.findFirst({
      where: eq(stats.key, 'visitors'),
    });

    if (!visitorStat) {
      await db.insert(stats).values({
        key: 'visitors',
        value: INITIAL_VALUES.visitors,
      });
      console.log(`Initialized visitors counter to ${INITIAL_VALUES.visitors}`);
    }

    // Prüfe und initialisiere Links-Counter
    const linksStat = await db.query.stats.findFirst({
      where: eq(stats.key, 'links'),
    });

    if (!linksStat) {
      await db.insert(stats).values({
        key: 'links',
        value: INITIAL_VALUES.links,
      });
      console.log(`Initialized links counter to ${INITIAL_VALUES.links}`);
    }
  } catch (error) {
    console.error('Error initializing stats:', error);
  }
}

export async function incrementStat(key: string): Promise<number> {
  try {
    const stat = await db.query.stats.findFirst({
      where: eq(stats.key, key),
    });

    if (!stat) {
      // Falls nicht vorhanden, mit Initialwert erstellen
      const initialValue = INITIAL_VALUES[key as keyof typeof INITIAL_VALUES] || 0;
      await db.insert(stats).values({
        key,
        value: initialValue + 1,
      });
      return initialValue + 1;
    }

    // Inkrementiere
    const newValue = stat.value + 1;
    await db.update(stats)
      .set({ value: newValue })
      .where(eq(stats.key, key));

    return newValue;
  } catch (error) {
    console.error(`Error incrementing stat ${key}:`, error);
    return 0;
  }
}

export async function getStat(key: string): Promise<number> {
  try {
    const stat = await db.query.stats.findFirst({
      where: eq(stats.key, key),
    });

    return stat?.value || 0;
  } catch (error) {
    console.error(`Error getting stat ${key}:`, error);
    return 0;
  }
}

