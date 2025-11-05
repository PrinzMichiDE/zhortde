/**
 * Domain-Blocklist Service
 * Prüft URLs gegen die Hagezi DNS Blocklist
 */

const BLOCKLIST_URL = 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/hosts/multi.txt';
const CACHE_DURATION = 3600000; // 1 Stunde in Millisekunden

interface BlocklistCache {
  domains: Set<string>;
  timestamp: number;
}

let blocklistCache: BlocklistCache | null = null;

/**
 * Lädt die Blocklist herunter und cacht sie
 */
async function loadBlocklist(): Promise<Set<string>> {
  // Prüfe Cache
  if (blocklistCache && Date.now() - blocklistCache.timestamp < CACHE_DURATION) {
    return blocklistCache.domains;
  }

  try {
    const response = await fetch(BLOCKLIST_URL, {
      next: { revalidate: 3600 }, // Cache für 1 Stunde
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blocklist: ${response.status}`);
    }

    const text = await response.text();
    const domains = new Set<string>();

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
          domains.add(domain);
        }
      }
    }

    // Update Cache
    blocklistCache = {
      domains,
      timestamp: Date.now(),
    };

    console.log(`Blocklist loaded: ${domains.size} domains`);
    return domains;
  } catch (error) {
    console.error('Error loading blocklist:', error);
    
    // Fallback: Verwende alten Cache wenn vorhanden
    if (blocklistCache) {
      console.warn('Using cached blocklist due to error');
      return blocklistCache.domains;
    }
    
    // Wenn kein Cache vorhanden, gebe leeres Set zurück (keine Blockierung)
    return new Set<string>();
  }
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
  const domain = extractDomain(url);
  if (!domain) {
    return false;
  }

  const blocklist = await loadBlocklist();
  
  // Prüfe exakte Domain
  if (blocklist.has(domain)) {
    return true;
  }

  // Prüfe auch Parent-Domains (z.B. für subdomain.example.com -> example.com)
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parentDomain = parts.slice(i).join('.');
    if (blocklist.has(parentDomain)) {
      return true;
    }
  }

  return false;
}

/**
 * Gibt Statistiken über die Blocklist zurück
 */
export async function getBlocklistStats(): Promise<{ size: number; lastUpdate: number }> {
  const domains = await loadBlocklist();
  return {
    size: domains.size,
    lastUpdate: blocklistCache?.timestamp || 0,
  };
}

