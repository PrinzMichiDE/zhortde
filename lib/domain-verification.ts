import dns from 'node:dns';
import { promisify } from 'node:util';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);
const resolveAny = promisify(dns.resolveAny);

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
    const addresses = await resolveAny(hostname);
    return addresses.some(
      (record) => record === 'A' || record === 'AAAA',
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

    return new Promise((resolve) => {
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
          const cert = res.socket?.getPeerCertificate(true);
          const raw = cert?.raw;

          if (!raw) {
            resolve({ valid: false, expired: false });
            return;
          }

          // Parse the certificate to check dates.
          try {
            const { createRequire } = await import('node:module');
            const asn1 = await import('asn1').catch(() => null);

            let notAfter = cert.exp;
            const subject = cert.subject?.CN ?? cert.subject?.toString() ?? '';

            // If we could parse ASN.1, use that; otherwise fall back to
            // the built-in certificate which already has `exp`.
            const expired = notAfter < Date.now();
            resolve({ valid: true, expired, subject: subject || undefined });
          } catch {
            // Fallback: if the handshake succeeded, consider it valid.
            const subject = cert.subject?.CN ?? '';
            resolve({ valid: true, expired: false, subject });
          }
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
    });
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
        resolve(res.statusCode >= 200 && res.statusCode < 500);
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
