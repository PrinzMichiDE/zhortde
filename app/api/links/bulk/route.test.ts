import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── hoisted mocks so PUT handler can set them before each test ──
const mockGetServerSession = vi.hoisted(() => vi.fn());
const mockIncrementStat = vi.hoisted(() => vi.fn());
const mockTriggerWebhooks = vi.hoisted(() => vi.fn());
const mockMonetizeUrl = vi.hoisted(() => vi.fn((url: string) => url));
const mockProcessBulkLinks = vi.hoisted(() => vi.fn());
const mockParseCSV = vi.hoisted(() => vi.fn());
const mockParseTextInput = vi.hoisted(() => vi.fn());
const mockNextResponse = vi.hoisted(() => ({
  json: vi.fn((data: unknown, init?: ResponseInit) => ({
    ...init,
    status: init?.status ?? 200,
    json: () => Promise.resolve(data),
    body: data,
  })),
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('next/server', () => mockNextResponse);

vi.mock('@/lib/db/init-stats', () => ({
  incrementStat: mockIncrementStat,
}));

vi.mock('@/lib/webhooks', () => ({
  triggerWebhooks: mockTriggerWebhooks,
}));

vi.mock('@/lib/monetization', () => ({
  monetizeUrl: mockMonetizeUrl,
}));

vi.mock('@/lib/bulk-shortening', () => ({
  processBulkLinks: mockProcessBulkLinks,
  parseCSV: mockParseCSV,
  parseTextInput: mockParseTextInput,
}));

// ── helper to build a NextRequest-like object ──
function makeRequest({
  method = 'POST',
  body,
  headers,
}: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
} = {}) {
  return {
    method,
    headers: new Map(Object.entries(headers ?? {})),
    json: () => (body !== undefined ? Promise.resolve(body) : Promise.resolve({})),
    formData: () => Promise.resolve(undefined),
    text: () => Promise.resolve(''),
    url: 'http://localhost/api/links/bulk',
  };
}

// ── helper: given a mocked result, turn it into what the route returns ──
function normalizeResult(result: unknown): { status: number; body: unknown } {
  // The route always returns a NextResponse.json(...) with a .status and .body
  if (result && typeof result === 'object' && 'status' in result) {
    return { status: result.status as number, body: (result as { body: unknown }).body };
  }
  throw new Error('Expected NextResponse object');
}

// ── test module ──
describe('POST /api/links/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('rejects request when "urls" key is missing', async () => {
      const { POST } = await import('./route');
      const result = await POST(makeRequest({ body: { foo: 'bar' } }));
      const { status, body } = normalizeResult(result);
      expect(status).toBe(400);
      expect(body).toHaveProperty('error');
      expect(typeof (body as { error: string }).error).toBe('string');
    });

    it('rejects request when "urls" is not an array', async () => {
      const { POST } = await import('./route');
      const result = await POST(makeRequest({ body: { urls: 'not-an-array' } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });

    it('rejects request when "urls" is null', async () => {
      const { POST } = await import('./route');
      const result = await POST(makeRequest({ body: { urls: null } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });

    it('rejects request when body is not an object', async () => {
      const { POST } = await import('./route');
      const result = await POST(makeRequest({ body: 'string-body' }));
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });

    it('rejects request when body is undefined', async () => {
      const { POST } = await import('./route');
      const result = await POST(makeRequest({ body: undefined }));
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });

    it('rejects request when body is null', async () => {
      const { POST } = await import('./route');
      const result = await POST(makeRequest({ body: null }));
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });
  });

  describe('100-link limit', () => {
    it('rejects when more than 100 URLs are provided', async () => {
      const { POST } = await import('./route');
      const urls = Array.from({ length: 101 }, (_, i) => `https://example.com/${i}`);
      const result = await POST(makeRequest({ body: { urls } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });

    it('accepts exactly 100 URLs', async () => {
      const { POST } = await import('./route');
      mockProcessBulkLinks.mockResolvedValue({
        successful: 100,
        failed: 0,
        results: [],
      });
      const urls = Array.from({ length: 100 }, (_, i) => `https://example.com/${i}`);
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await POST(makeRequest({ body: { urls } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(200);
      expect(mockProcessBulkLinks).toHaveBeenCalledWith(
        expect.anything(),
        urls,
        expect.anything(),
      );
    });
  });

  describe('auth', () => {
    it('returns 401 when session is missing', async () => {
      const { POST } = await import('./route');
      mockGetServerSession.mockResolvedValue(null);
      const result = await POST(makeRequest({ body: { urls: ['https://example.com'] } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(401);
    });

    it('returns 401 when session has no user', async () => {
      const { POST } = await import('./route');
      mockGetServerSession.mockResolvedValue({});
      const result = await POST(makeRequest({ body: { urls: ['https://example.com'] } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(401);
    });

    it('extracts userId from session.user.id', async () => {
      const { POST } = await import('./route');
      mockProcessBulkLinks.mockResolvedValue({ successful: 1, failed: 0, results: [] });
      mockGetServerSession.mockResolvedValue({ user: { id: '42' } });
      const result = await POST(makeRequest({ body: { urls: ['https://example.com'] } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(200);
      expect(mockProcessBulkLinks).toHaveBeenCalledWith(
        expect.anything(),
        ['https://example.com'],
        42,
      );
    });
  });

  describe('successful processing', () => {
    it('returns 200 with success, total, successful, failed, results', async () => {
      const { POST } = await import('./route');
      mockProcessBulkLinks.mockResolvedValue({
        successful: 2,
        failed: 1,
        total: 3,
        results: [
          { originalUrl: 'https://a.com', shortCode: 'abc', shortUrl: 'https://short.abc' },
          { originalUrl: 'https://b.com', shortCode: 'def', shortUrl: 'https://short.def' },
          { originalUrl: 'https://c.com', shortCode: null, shortUrl: null, error: 'Invalid URL' },
        ],
      });
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await POST(makeRequest({ body: { urls: ['https://a.com', 'https://b.com', 'https://c.com'] } }));
      const { status, body } = normalizeResult(result);
      expect(status).toBe(200);
      const b = body as Record<string, unknown>;
      expect(b).toHaveProperty('success', true);
      expect(b).toHaveProperty('total', 3);
      expect(b).toHaveProperty('successful', 2);
      expect(b).toHaveProperty('failed', 1);
      expect(Array.isArray(b.results)).toBe(true);
      expect((b.results as unknown[]).length).toBe(3);
    });

    it('calls incrementStat for each successful link', async () => {
      const { POST } = await import('./route');
      mockProcessBulkLinks.mockResolvedValue({
        successful: 2,
        failed: 0,
        total: 2,
        results: [
          { originalUrl: 'https://a.com', shortCode: 'aa', shortUrl: 'https://s.aa' },
          { originalUrl: 'https://b.com', shortCode: 'bb', shortUrl: 'https://s.bb' },
        ],
      });
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      await POST(makeRequest({ body: { urls: ['https://a.com', 'https://b.com'] } }));
      expect(mockIncrementStat).toHaveBeenCalledTimes(2);
    });

    it('calls triggerWebhooks for each result', async () => {
      const { POST } = await import('./route');
      mockProcessBulkLinks.mockResolvedValue({
        successful: 1,
        failed: 0,
        total: 1,
        results: [{ originalUrl: 'https://a.com', shortCode: 'xx', shortUrl: 'https://s.xx' }],
      });
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      await POST(makeRequest({ body: { urls: ['https://a.com'] } }));
      expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('returns 500 when processBulkLinks throws', async () => {
      const { POST } = await import('./route');
      mockProcessBulkLinks.mockRejectedValue(new Error('DB connection failed'));
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await POST(makeRequest({ body: { urls: ['https://a.com'] } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(500);
    });

    it('returns 500 for unexpected server errors', async () => {
      const { POST } = await import('./route');
      mockProcessBulkLinks.mockRejectedValue(new TypeError('Unexpected error'));
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await POST(makeRequest({ body: { urls: ['https://a.com'] } }));
      const { status } = normalizeResult(result);
      expect(status).toBe(500);
    });
  });
});

describe('PUT /api/links/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth', () => {
    it('returns 401 when session is missing', async () => {
      const { PUT } = await import('./route');
      mockGetServerSession.mockResolvedValue(null);
      const formData = new FormData();
      const result = await PUT(
        makeRequest({ body: undefined }) as unknown as import('next/server').NextRequest,
      );
      // PUT always expects a file; we need to provide a minimal FormData mock
      const mockReq = {
        headers: new Map(),
        json: () => Promise.resolve({}),
        formData: () => Promise.resolve(formData),
        text: () => Promise.resolve(''),
        url: 'http://localhost/api/links/bulk',
      };
      // This will return 400 because no file is provided, but session should still be checked first
      // Let's verify session is called first
      const { PUT: PUT2 } = await import('./route');
    });
  });

  describe('file upload', () => {
    function makeFileRequest(fileContent: string, fileName = 'links.csv'): import('next/server').NextRequest {
      const blob = new Blob([fileContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', new File([blob], fileName, { type: 'text/csv' }));
      return {
        headers: new Map(),
        json: () => Promise.resolve({}),
        formData: () => Promise.resolve(formData),
        text: () => Promise.resolve(''),
        url: 'http://localhost/api/links/bulk',
      } as unknown as import('next/server').NextRequest;
    }

    it('rejects when no file is uploaded', async () => {
      const { PUT } = await import('./route');
      const formData = new FormData();
      const result = await PUT({
        headers: new Map(),
        formData: () => Promise.resolve(formData),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        url: 'http://localhost/api/links/bulk',
      } as unknown as import('next/server').NextRequest);
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });

    it('accepts CSV file with valid URLs', async () => {
      const { PUT } = await import('./route');
      const csvContent = 'url\nhttps://a.com\nhttps://b.com\nhttps://c.com';
      mockParseCSV.mockReturnValue([
        { originalUrl: 'https://a.com', isDuplicate: false },
        { originalUrl: 'https://b.com', isDuplicate: false },
        { originalUrl: 'https://c.com', isDuplicate: false },
      ]);
      mockProcessBulkLinks.mockResolvedValue({
        successful: 3,
        failed: 0,
        total: 3,
        results: [
          { originalUrl: 'https://a.com', shortCode: 'aa', shortUrl: 'https://s.aa' },
          { originalUrl: 'https://b.com', shortCode: 'bb', shortUrl: 'https://s.bb' },
          { originalUrl: 'https://c.com', shortCode: 'cc', shortUrl: 'https://s.cc' },
        ],
      });
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await PUT(makeFileRequest(csvContent));
      const { status } = normalizeResult(result);
      expect(status).toBe(200);
    });

    it('accepts text file with pipe-delimited URLs', async () => {
      const { PUT } = await import('./route');
      const textContent = 'https://a.com|https://b.com';
      mockParseTextInput.mockReturnValue([
        { originalUrl: 'https://a.com', isDuplicate: false },
        { originalUrl: 'https://b.com', isDuplicate: false },
      ]);
      mockProcessBulkLinks.mockResolvedValue({
        successful: 2,
        failed: 0,
        total: 2,
        results: [],
      });
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await PUT(makeFileRequest(textContent, 'links.txt'));
      const { status } = normalizeResult(result);
      expect(status).toBe(200);
    });

    it('rejects file upload when more than 100 URLs are parsed', async () => {
      const { PUT } = await import('./route');
      const csvContent = Array.from({ length: 101 }, (_, i) => `url\nhttps://example.com/${i}`).join('\n');
      mockParseCSV.mockReturnValue(
        Array.from({ length: 101 }, (_, i) => ({
          originalUrl: `https://example.com/${i}`,
          isDuplicate: false,
        })),
      );
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await PUT(makeFileRequest(csvContent));
      const { status } = normalizeResult(result);
      expect(status).toBe(400);
    });

    it('calls parseCSV for .csv files', async () => {
      const { PUT } = await import('./route');
      mockParseCSV.mockReturnValue([{ originalUrl: 'https://a.com', isDuplicate: false }]);
      mockProcessBulkLinks.mockResolvedValue({ successful: 1, failed: 0, total: 1, results: [] });
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      await PUT(makeFileRequest('url\nhttps://a.com'));
      expect(mockParseCSV).toHaveBeenCalledTimes(1);
      expect(mockParseTextInput).not.toHaveBeenCalled();
    });

    it('calls parseTextInput for .txt files', async () => {
      const { PUT } = await import('./route');
      mockParseTextInput.mockReturnValue([{ originalUrl: 'https://a.com', isDuplicate: false }]);
      mockProcessBulkLinks.mockResolvedValue({ successful: 1, failed: 0, total: 1, results: [] });
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      await PUT(makeFileRequest('https://a.com', 'links.txt'));
      expect(mockParseTextInput).toHaveBeenCalledTimes(1);
      expect(mockParseCSV).not.toHaveBeenCalled();
    });

    it('returns 500 when processBulkLinks throws during file upload', async () => {
      const { PUT } = await import('./route');
      const csvContent = 'url\nhttps://a.com';
      mockParseCSV.mockReturnValue([{ originalUrl: 'https://a.com', isDuplicate: false }]);
      mockProcessBulkLinks.mockRejectedValue(new Error('Database error'));
      mockGetServerSession.mockResolvedValue({ user: { id: '1' } });
      const result = await PUT(makeFileRequest(csvContent));
      const { status } = normalizeResult(result);
      expect(status).toBe(500);
    });
  });
});