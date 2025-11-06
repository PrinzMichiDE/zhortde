/**
 * Domain-Blocklist Service
 * Prüft URLs gegen die Hagezi DNS Blocklist (DB-backed)
 */

import { isDomainBlocked, checkAndUpdateBlocklist, getBlocklistStats as getDbBlocklistStats } from './db/blocklist-service';

// Initialisiere Blocklist beim Server-Start
let initPromise: Promise<void> | null = null;

async function ensureBlocklistInitialized() {
  if (!initPromise) {
    initPromise = checkAndUpdateBlocklist();
  }
  await initPromise;
}

/**
 * Extrahiert die Domain aus einer URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Prüft ob eine URL auf der Blocklist steht
 */
export async function isUrlBlocked(url: string): Promise<boolean> {
  try {
    const domain = extractDomain(url);
    if (!domain) {
      return false;
    }

    // Stelle sicher, dass Blocklist initialisiert ist
    await ensureBlocklistInitialized();

    // Prüfe gegen Datenbank
    return await isDomainBlocked(domain);
  } catch (error) {
    console.error('Error checking if URL is blocked:', error);
    // Bei Fehler: nicht blockieren (fail-open)
    return false;
  }
}

/**
 * Gibt Statistiken über die Blocklist zurück
 */
export async function getBlocklistStats(): Promise<{ 
  total: number; 
  lastUpdate: Date | null;
  ageHours: number;
}> {
  try {
    return await getDbBlocklistStats();
  } catch (error) {
    console.error('Error getting blocklist stats:', error);
    return { total: 0, lastUpdate: null, ageHours: 0 };
  }
}

