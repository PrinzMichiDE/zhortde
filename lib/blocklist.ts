/**
 * Domain-Blocklist Service
 * Prüft URLs gegen die Hagezi DNS Blocklist (DB-backed) und Google Safe Browsing
 */

import { isDomainBlocked, checkAndUpdateBlocklist, getBlocklistStats as getDbBlocklistStats } from './db/blocklist-service';
import { checkPhishing } from './phishing-check';

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
 * Prüft ob eine URL auf der Blocklist steht oder Phishing ist
 */
export async function isUrlBlocked(url: string): Promise<boolean> {
  try {
    const domain = extractDomain(url);
    if (!domain) {
      return false;
    }

    // 1. Lokale Blocklist prüfen (schnell)
    await ensureBlocklistInitialized();
    const isLocalBlocked = await isDomainBlocked(domain);
    
    if (isLocalBlocked) {
      return true;
    }

    // 2. Google Safe Browsing prüfen (API Call, langsamer)
    // Nur prüfen, wenn lokal nicht blockiert
    const isPhishing = await checkPhishing(url);
    
    return isPhishing;

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
