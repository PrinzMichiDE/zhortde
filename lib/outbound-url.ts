export class OutboundUrlBlockedError extends Error {
  readonly code = 'OUTBOUND_URL_BLOCKED';

  constructor(message: string) {
    super(message);
    this.name = 'OutboundUrlBlockedError';
  }
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
]);

const PRIVATE_HOSTNAME_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^0\./,
  /^fc00:/i,
  /^fe80:/i,
  /^::ffff:127\./i,
  /^::ffff:10\./i,
  /\.local$/i,
  /\.internal$/i,
];

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (PRIVATE_HOSTNAME_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (/^\d+$/.test(normalized)) {
    return true;
  }

  if (/^0x[0-9a-f]+$/i.test(normalized) || /^0\d+\./.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Validates that a URL is safe for server-side outbound requests (SSRF prevention).
 */
export function assertSafeOutboundUrl(rawUrl: string): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new OutboundUrlBlockedError('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new OutboundUrlBlockedError('Only HTTP and HTTPS URLs are allowed');
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new OutboundUrlBlockedError('Private or local URLs are not allowed');
  }

  return parsed;
}

export function isSafeOutboundUrl(rawUrl: string): boolean {
  try {
    assertSafeOutboundUrl(rawUrl);
    return true;
  } catch {
    return false;
  }
}
