import { describe, expect, it } from 'vitest';
import { assertSafeOutboundUrl, isSafeOutboundUrl } from './security';

describe('outbound URL safety (SSRF prevention)', () => {
  it('allows public HTTPS URLs', () => {
    expect(isSafeOutboundUrl('https://example.com/path')).toBe(true);
    expect(() => assertSafeOutboundUrl('https://example.com/path')).not.toThrow();
  });

  it('allows public HTTP URLs in development', () => {
    expect(isSafeOutboundUrl('http://example.com')).toBe(true);
  });

  it('blocks localhost', () => {
    expect(isSafeOutboundUrl('http://localhost:3000')).toBe(false);
    expect(isSafeOutboundUrl('http://127.0.0.1/admin')).toBe(false);
    expect(isSafeOutboundUrl('http://[::1]/secret')).toBe(false);
  });

  it('blocks private and link-local IPv4 ranges', () => {
    expect(isSafeOutboundUrl('http://10.0.0.1/internal')).toBe(false);
    expect(isSafeOutboundUrl('http://172.16.0.1/metadata')).toBe(false);
    expect(isSafeOutboundUrl('http://192.168.1.1/router')).toBe(false);
    expect(isSafeOutboundUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('throws with a descriptive message for unsafe URLs', () => {
    expect(() => assertSafeOutboundUrl('http://169.254.169.254/')).toThrow(
      /Private oder lokale URLs/,
    );
  });

  it('blocks non-http(s) protocols', () => {
    expect(isSafeOutboundUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeOutboundUrl('ftp://example.com')).toBe(false);
  });
});
