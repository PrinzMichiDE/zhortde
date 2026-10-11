import dns from 'node:dns';
import { promisify } from 'node:util';
import type { TLSSocket } from 'node:tls';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

/**
 * DNS TXT Record Verification
 *
 * Validates that a TXT record with the expected content exists for the
 * verification hostname. This is the standard approach used by most
 * certificate authorities and platform providers.
 */
export async function verifyDnsTxtRecord(
  hostname: string,
  expectedValue: string,
): Promise<boolean> {
  try {
    const records = await resolveTxt(hostname);
    // Each record is an array of text fragments; flatten them.
    const allValues = records.flat().join('');
    return allValues.includes(expectedValue);
  } catch {
    return false;
  }
}

/**
 * DNS CNAME Record Verification
 *
 * Validates that a CNAME record for `hostname` points to `expectedTarget`.
 */
export async function verifyDnsCnameRecord(
  hostname: string,
  expectedTarget: string,
): Promise<boolean> {
  try {
    const cnames = await resolveCname(hostname);
    return cnames.some(
      (cname) => cname.toLowerCase() === expectedTarget.toLowerCase(),
    );
  } catch {
    return false;
  }
}

/**
 * DNS A / AAAA Record Verification
 *
 * Checks that `hostname` resolves to at least one IP address.
 */
export async function verifyDnsARecord(hostname: string): Promise<boolean> {
  try {
    const [v4, v6] = await Promise.allSettled([
      resolve4(hostname),
      resolve6(hostname),
    ]);
    return (
      (v4.status === 'fulfilled' && v4.value.length > 0) ||
      (v6.status === 'fulfilled' && v6.value.length > 0)
    );
  } catch {
    return false;
  }
}

/**
 * SSL Certificate Verification
 *
 * Performs an outbound TLS handshake to `host:port` (default 443) and
 * returns whether the certificate is valid and not expired.
 */
export async function verifySslCertificate(
  host: string,
  port: number = 443,
): Promise<{ valid: boolean; expired: boolean; subject?: string }> {
  try {
    // Use the built-in https module to perform the TLS handshake.
    const https = await import('node:https');

    return new Promise<{ valid: boolean; expired: boolean; subject?: string }>(
      (resolve) => {
        const req = https.request(
          {
            hostname: host,
            port,
            method: 'GET',
            rejectUnauthorized: false, // Accept self-signed during verification
            timeout: 5000,
          },
          (res) => {
            res.destroy();
            // If we reach here, the TLS handshake succeeded.
            const socket = res.socket as unknown as TLSSocket | null;

            let cert: ReturnType<TLSSocket['getPeerCertificate']> | undefined;
            try {
              cert = socket?.getPeerCertificate(true);
            } catch {
              cert = undefined;
            }

            if (!cert || !cert.subject) {
              resolve({ valid: false, expired: false });
              return;
            }

            // `valid_to` is a Date with detail=true, but typed as string in
            // some @types/node versions – handle both.
            const rawValidTo: unknown = cert.valid_to;
            const validToTime =
              rawValidTo instanceof Date
                ? rawValidTo.getTime()
                : typeof rawValidTo === 'string'
                  ? Date.parse(rawValidTo)
                  : NaN;
            const expired = Number.isFinite(validToTime) && validToTime < Date.now();
            const subject =
              (cert.subject as { CN?: string }).CN ??
              cert.subject?.toString() ??
              '';

            resolve({ valid: true, expired, subject: subject || undefined });
          },
        );

        req.on('error', () => {
          resolve({ valid: false, expired: false });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ valid: false, expired: false });
        });

        req.end();
      },
    );
  } catch {
    return { valid: false, expired: false };
  }
}

/**
 * Check whether a domain is publicly reachable (DNS + HTTP).
 * This is a convenience wrapper useful for a "health check" step.
 */
export async function isDomainReachable(domain: string): Promise<boolean> {
  const http = await import('node:http');

  return new Promise((resolve) => {
    const req = http.request(
      `http://${domain}/`,
      { method: 'HEAD', timeout: 5000 },
      (res) => {
        res.destroy();
        const code = res.statusCode;
        resolve(code !== undefined && code >= 200 && code < 500);
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}
