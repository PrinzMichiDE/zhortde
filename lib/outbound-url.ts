/**
 * Outbound URL safety checks to mitigate SSRF when the server fetches user-supplied URLs.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata.google',
]);

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const PRIVATE_IPV6_PATTERNS = [
  /^::1$/,
  /^fc/i,
  /^fd/i,
  /^fe80:/i,
  /^::ffff:127\./i,
  /^::ffff:10\./i,
  /^::ffff:192\.168\./i,
  /^::ffff:169\.254\./i,
  /^::ffff:0\./i,
];

export class OutboundUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutboundUrlError';
  }
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

export function isBlockedOutboundHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    return true;
  }

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  ) {
    return true;
  }

  if (PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  if (PRIVATE_IPV6_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return false;
}

export function isSafeOutboundUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    if (parsed.username || parsed.password) {
      return false;
    }

    if (isBlockedOutboundHostname(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function assertSafeOutboundUrl(url: string): void {
  if (!isSafeOutboundUrl(url)) {
    throw new OutboundUrlError('Outbound URL is not allowed');
  }
}
