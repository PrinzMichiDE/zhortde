export type RecentLink = {
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  createdAt: string;
};

const STORAGE_KEY = 'zhort:recent-links';
const MAX_RECENT = 8;

export function getRecentLinks(): RecentLink[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecentLink[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentLink(entry: Omit<RecentLink, 'createdAt'>): RecentLink[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const next: RecentLink = {
    ...entry,
    createdAt: new Date().toISOString(),
  };

  const existing = getRecentLinks().filter((link) => link.shortCode !== next.shortCode);
  const updated = [next, ...existing].slice(0, MAX_RECENT);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('zhort:recent-updated'));
  return updated;
}

export function clearRecentLinks(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}
