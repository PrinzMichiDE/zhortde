/**
 * Database-backed Blocklist Service
 * Lädt und cached die Hagezi DNS Blocklist in der Datenbank
 */

import { db } from './index';
import { blockedDomains } from './schema';
import { eq, sql } from 'drizzle-orm';

const BLOCKLIST_URL = 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/hosts/multi.txt';
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 Stunden

/**
 * Lädt die Blocklist herunter und speichert sie in der DB
 */
export async function updateBlocklist(): Promise<{ added: number; total: number }> {
  try {
    console.log('Fetching blocklist from CDN...');
    
    const response = await fetch(BLOCKLIST_URL, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blocklist: ${response.status}`);
    }

    const text = await response.text();
    const domains: string[] = [];

    // Parse die Hosts-Datei
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Überspringe Kommentare und leere Zeilen
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Format: "0.0.0.0 domain.com" oder "127.0.0.1 domain.com"
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const domain = parts[1].toLowerCase();
        if (domain && domain !== 'localhost') {
          domains.push(domain);
        }
      }
    }

    console.log(`Parsed ${domains.length} domains from blocklist`);

    // Lösche alte Einträge
    await db.delete(blockedDomains);

    // Batch-Insert für Performance (PostgreSQL kann große Batches)
    const batchSize = 1000;
    let added = 0;

    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      await db.insert(blockedDomains).values(
        batch.map(domain => ({ domain, lastUpdated: new Date() }))
      ).onConflictDoNothing(); // Ignoriere Duplikate
      
      added += batch.length;
      
      // Progress-Log alle 10k Domains
      if (added % 10000 === 0) {
        console.log(`Inserted ${added}/${domains.length} domains...`);
      }
    }

    console.log(`✅ Blocklist updated: ${added} domains in database`);
    
    return { added, total: domains.length };
  } catch (error) {
    console.error('Error updating blocklist:', error);
    throw error;
  }
}

/**
 * Prüft ob eine Domain blockiert ist (DB-basiert)
 */
export async function isDomainBlocked(domain: string): Promise<boolean> {
  try {
    const normalizedDomain = domain.toLowerCase();
    
    // Prüfe exakte Domain
    const result = await db.query.blockedDomains.findFirst({
      where: eq(blockedDomains.domain, normalizedDomain),
    });

    if (result) {
      return true;
    }

    // Prüfe auch Parent-Domains (z.B. für subdomain.example.com -> example.com)
    const parts = normalizedDomain.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const parentDomain = parts.slice(i).join('.');
      const parentResult = await db.query.blockedDomains.findFirst({
        where: eq(blockedDomains.domain, parentDomain),
      });
      
      if (parentResult) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking blocked domain:', error);
    // Bei Fehler: nicht blockieren (fail-open)
    return false;
  }
}

/**
 * Prüft ob Update nötig ist und führt es ggf. durch
 */
export async function checkAndUpdateBlocklist(): Promise<void> {
  try {
    // Hole das neueste Update-Datum
    const latestUpdate = await db.query.blockedDomains.findFirst({
      orderBy: (blockedDomains, { desc }) => [desc(blockedDomains.lastUpdated)],
    });

    const shouldUpdate = !latestUpdate || 
      (Date.now() - latestUpdate.lastUpdated.getTime() > UPDATE_INTERVAL);

    if (shouldUpdate) {
      console.log('Blocklist is outdated or empty, updating...');
      await updateBlocklist();
    } else {
      const age = Math.round((Date.now() - latestUpdate.lastUpdated.getTime()) / (60 * 60 * 1000));
      console.log(`Blocklist is up-to-date (${age}h old)`);
    }
  } catch (error) {
    console.error('Error checking blocklist update:', error);
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
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(blockedDomains);
    
    const latestUpdate = await db.query.blockedDomains.findFirst({
      orderBy: (blockedDomains, { desc }) => [desc(blockedDomains.lastUpdated)],
    });

    const ageHours = latestUpdate 
      ? Math.round((Date.now() - latestUpdate.lastUpdated.getTime()) / (60 * 60 * 1000))
      : 0;

    return {
      total: countResult?.count || 0,
      lastUpdate: latestUpdate?.lastUpdated || null,
      ageHours,
    };
  } catch (error) {
    console.error('Error getting blocklist stats:', error);
    return { total: 0, lastUpdate: null, ageHours: 0 };
  }
}

