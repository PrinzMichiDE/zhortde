import { describe, expect, it, vi } from 'vitest';

const mockDbQuery = vi.hoisted(() => ({
  links: { findFirst: vi.fn() },
}));

const mockLinksTable = vi.hoisted(() => ({}));

const mockNanoid = vi.hoisted(() => vi.fn());

vi.mock('./db', () => ({
  db: {
    query: mockDbQuery,
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('./db/schema', () => ({
  links: mockLinksTable,
}));

vi.mock('nanoid', () => ({
  nanoid: mockNanoid,
}));

vi.mock('./db/init-stats', () => ({
  incrementStat: vi.fn(),
}));

vi.mock('./monetization', () => ({
  monetizeUrl: vi.fn((url: string) => `https://ads.example.com/click?url=${encodeURIComponent(url)}`),
}));

vi.mock('node:url', () => ({
  URL: class URL {
    hostname: string;
    constructor(public input: string) {
      this.hostname = 'example.com';
    }
  },
}));

vi.mock('node:https', () => ({
  request: vi.fn(),
}));

vi.mock('node:http', () => ({
  request: vi.fn(),
}));

import { processBulkLinks, parseCSV, parseTextInput, type BulkLinkResult } from './bulk-shortening';
import { db } from './db';

const now = new Date('2026-01-01T00:00:00.000Z');
vi.useFakeTimers({ now });

describe('parseCSV', () => {
  it('parses a simple CSV with headers and a single URL row', () => {
    const csv = 'url\nhttps://example.com/long\n';
    const result = parseCSV(csv);
    expect(result).toEqual([{ longUrl: 'https://example.com/long' }]);
  });

  it('parses a CSV with multiple URL rows', () => {
    const csv = 'url\nhttps://example.com/1\nhttps://example.com/2\nhttps://example.com/3\n';
    const result = parseCSV(csv);
    expect(result).toEqual([
      { longUrl: 'https://example.com/1' },
      { longUrl: 'https://example.com/2' },
      { longUrl: 'https://example.com/3' },
    ]);
  });

  it('extracts customCode, password and expiresIn from CSV columns', () => {
    const csv = 'url,customCode,password,expiresIn\nhttps://example.com,mycode,pass123,30d\n';
    const result = parseCSV(csv);
    expect(result).toEqual([{
      longUrl: 'https://example.com',
      customCode: 'mycode',
      password: 'pass123',
      expiresIn: '30d',
    }]);
  });

  it('ignores the header row and parses rows without headers', () => {
    const csv = 'https://example.com/1\nhttps://example.com/2\n';
    const result = parseCSV(csv);
    expect(result).toEqual([
      { longUrl: 'https://example.com/1' },
      { longUrl: 'https://example.com/2' },
    ]);
  });

  it('skips empty lines and whitespace-only lines', () => {
    const csv = 'url\n\nhttps://example.com\n  \n\n';
    const result = parseCSV(csv);
    expect(result).toEqual([{ longUrl: 'https://example.com' }]);
  });

  it('skips rows where the URL cell is empty or whitespace', () => {
    const csv = 'url\n\nhttps://example.com\n   \n';
    const result = parseCSV(csv);
    expect(result).toEqual([{ longUrl: 'https://example.com' }]);
  });

  it('handles URLs with commas enclosed in quotes', () => {
    const csv = 'url\n"https://example.com?a=1&b=2"\n';
    const result = parseCSV(csv);
    expect(result).toEqual([{ longUrl: 'https://example.com?a=1&b=2' }]);
  });

  it('handles rows with extra columns that get ignored', () => {
    const csv = 'url,customCode,password,expiresIn\nhttps://example.com/code1,pw1,60d,extra\n';
    const result = parseCSV(csv);
    expect(result).toEqual([{
      longUrl: 'https://example.com/code1',
      customCode: 'pw1',
      password: '60d',
      expiresIn: 'extra',
    }]);
  });

  it('returns an empty array when CSV has only a header', () => {
    const csv = 'url\n';
    const result = parseCSV(csv);
    expect(result).toEqual([]);
  });

  it('handles mixed valid and invalid rows', () => {
    const csv = 'url\n\nhttps://valid.com\n   \nhttps://also-valid.com\n';
    const result = parseCSV(csv);
    expect(result).toEqual([
      { longUrl: 'https://valid.com' },
      { longUrl: 'https://also-valid.com' },
    ]);
  });
});

describe('parseTextInput', () => {
  it('parses a single URL', () => {
    const text = 'https://example.com';
    const result = parseTextInput(text);
    expect(result).toEqual([{ longUrl: 'https://example.com' }]);
  });

  it('parses multiple newline-separated URLs', () => {
    const text = 'https://example.com/1\nhttps://example.com/2\nhttps://example.com/3';
    const result = parseTextInput(text);
    expect(result).toEqual([
      { longUrl: 'https://example.com/1' },
      { longUrl: 'https://example.com/2' },
      { longUrl: 'https://example.com/3' },
    ]);
  });

  it('trims whitespace from each URL', () => {
    const text = '  https://example.com  \n  https://other.com  ';
    const result = parseTextInput(text);
    expect(result).toEqual([
      { longUrl: 'https://example.com' },
      { longUrl: 'https://other.com' },
    ]);
  });

  it('skips empty lines', () => {
    const text = 'https://example.com\n\n\nhttps://other.com';
    const result = parseTextInput(text);
    expect(result).toEqual([
      { longUrl: 'https://example.com' },
      { longUrl: 'https://other.com' },
    ]);
  });

  it('skips whitespace-only lines', () => {
    const text = 'https://example.com\n   \n\t\nhttps://other.com';
    const result = parseTextInput(text);
    expect(result).toEqual([
      { longUrl: 'https://example.com' },
      { longUrl: 'https://other.com' },
    ]);
  });

  it('returns an empty array for empty or whitespace-only input', () => {
    expect(parseTextInput('')).toEqual([]);
    expect(parseTextInput('   \n\t  ')).toEqual([]);
  });

  it('deduplicates URLs, keeping first occurrence', () => {
    const text = 'https://example.com\nhttps://example.com\nhttps://other.com';
    const result = parseTextInput(text);
    expect(result).toEqual([
      { longUrl: 'https://example.com' },
      { longUrl: 'https://other.com' },
    ]);
  });
});

describe('processBulkLinks', () => {
  it('creates links successfully and returns results with shortUrl', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('abc123');

    const linksToProcess = [{ longUrl: 'https://example.com' }];
    const results = await processBulkLinks(linksToProcess);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      success: true,
      longUrl: 'https://example.com',
      shortCode: 'abc123',
    });
    expect(results[0].shortUrl).toBeDefined();
  });

  it('handles custom codes that are unique', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);

    const linksToProcess = [{ longUrl: 'https://example.com', customCode: 'mycode' }];
    const results = await processBulkLinks(linksToProcess);

    expect(results[0].success).toBe(true);
    expect(results[0].shortCode).toBe('mycode');
  });

  it('handles custom codes that are taken by appending random suffix', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue({ id: 1 } as never);

    const linksToProcess = [{ longUrl: 'https://example.com', customCode: 'taken' }];
    const results = await processBulkLinks(linksToProcess);

    expect(results[0].success).toBe(true);
    expect(results[0].shortCode).toMatch(/^taken-[\w-]{4}$/);
  });

  it('handles invalid URLs with an error result', async () => {
    const linksToProcess = [{ longUrl: 'not-a-valid-url' }];
    const results = await processBulkLinks(linksToProcess);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toMatch(/Invalid URL/i);
  });

  it('handles blocked URLs by returning an error', async () => {
    const linksToProcess = [{ longUrl: 'https://blocked-domain.com' }];
    const results = await processBulkLinks(linksToProcess);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toMatch(/blocked/i);
  });

  it('honors password option', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('passcode');

    const linksToProcess = [{ longUrl: 'https://example.com', password: 'secret' }];
    const results = await processBulkLinks(linksToProcess);

    expect(results[0].success).toBe(true);
    const insertCall = vi.mocked(db.insert).mock.calls[0];
    expect(insertCall).toBeDefined();
    const values = insertCall[0];
    expect(values.values).toEqual(expect.objectContaining({ password: 'secret' }));
  });

  it('honors expiresIn option with "30d"', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('expcode');

    const linksToProcess = [{ longUrl: 'https://example.com', expiresIn: '30d' }];
    await processBulkLinks(linksToProcess);

    const insertCall = vi.mocked(db.insert).mock.calls[0];
    const values = insertCall[0];
    const expectedExpiry = new Date('2026-01-31T00:00:00.000Z');
    expect(values.values.expiresAt?.getTime()).toBe(expectedExpiry.getTime());
  });

  it('honors isPublic option', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('pubcode');

    const linksToProcess = [{ longUrl: 'https://example.com', isPublic: false }];
    await processBulkLinks(linksToProcess);

    const insertCall = vi.mocked(db.insert).mock.calls[0];
    const values = insertCall[0];
    expect(values.values.isPublic).toBe(false);
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(db.insert).mockRejectedValue(new Error('DB connection failed'));

    const linksToProcess = [{ longUrl: 'https://example.com' }];
    const results = await processBulkLinks(linksToProcess);

    expect(results[0].success).toBe(false);
    expect(results[0].error).toBe('Failed to create link: DB connection failed');
  });

  it('returns multiple results for multiple links, some failing', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('validcode');

    const linksToProcess = [
      { longUrl: 'https://example.com' },
      { longUrl: 'invalid-url' },
      { longUrl: 'https://other.com' },
    ];
    const results = await processBulkLinks(linksToProcess);

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });

  it('calls incrementStat on successful link creation', async () => {
    const { incrementStat } = await import('./db/init-stats');

    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('statcode');

    const linksToProcess = [{ longUrl: 'https://example.com' }];
    await processBulkLinks(linksToProcess);

    expect(incrementStat).toHaveBeenCalledWith('links_created');
  });

  it('calls monetizeUrl on successful link creation', async () => {
    const { monetizeUrl } = await import('./monetization');

    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('monetizecode');

    const linksToProcess = [{ longUrl: 'https://example.com' }];
    await processBulkLinks(linksToProcess);

    expect(monetizeUrl).toHaveBeenCalledWith('https://example.com');
  });

  it('generates a non-custom random code when no customCode provided', async () => {
    vi.mocked(mockDbQuery.links.findFirst).mockResolvedValue(null);
    vi.mocked(mockNanoid).mockReturnValue('xyz');

    const linksToProcess = [{ longUrl: 'https://example.com' }];
    await processBulkLinks(linksToProcess);

    const insertCall = vi.mocked(db.insert).mock.calls[0];
    const values = insertCall[0];
    expect(values.values.shortCode).toBe('xyz');
  });
});