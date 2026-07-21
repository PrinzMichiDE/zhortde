import { createHmac, timingSafeEqual } from 'node:crypto';

export const PASTE_ACCESS_COOKIE = 'paste_access';
export const PASTE_ACCESS_TTL_SECONDS = 60 * 60;

function getAccessSecret(secret?: string): string {
  const resolvedSecret = secret ?? process.env.NEXTAUTH_SECRET;

  if (!resolvedSecret) {
    throw new Error('NEXTAUTH_SECRET is required for password-protected paste access');
  }

  return resolvedSecret;
}

function signAccessGrant(
  slug: string,
  passwordHash: string,
  expiresAt: number,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(`${slug}\0${passwordHash}\0${expiresAt}`)
    .digest('base64url');
}

export function createPasteAccessToken(
  slug: string,
  passwordHash: string,
  secret?: string,
  now = Date.now(),
): string {
  const expiresAt = now + PASTE_ACCESS_TTL_SECONDS * 1_000;
  const signature = signAccessGrant(
    slug,
    passwordHash,
    expiresAt,
    getAccessSecret(secret),
  );

  return `${expiresAt}.${signature}`;
}

export function verifyPasteAccessToken(
  token: string | undefined,
  slug: string,
  passwordHash: string,
  secret?: string,
  now = Date.now(),
): boolean {
  if (!token) {
    return false;
  }

  const [expiresAtValue, suppliedSignature, extraPart] = token.split('.');
  const expiresAt = Number(expiresAtValue);

  if (
    extraPart !== undefined ||
    !suppliedSignature ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now
  ) {
    return false;
  }

  const expectedSignature = signAccessGrant(
    slug,
    passwordHash,
    expiresAt,
    getAccessSecret(secret),
  );
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export function getPasteAccessCookiePath(slug: string): string {
  return `/p/${encodeURIComponent(slug)}`;
}
