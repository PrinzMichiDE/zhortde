import { describe, expect, it } from 'vitest';
import {
  assertSafeOutboundUrl,
  isBlockedOutboundHostname,
  isSafeOutboundUrl,
  OutboundUrlError,
} from './outbound-url';

describe('outbound URL safety', () => {
  it('blocks localhost, metadata, and private network hosts', () => {
    expect(isBlockedOutboundHostname('localhost')).toBe(true);
    expect(isBlockedOutboundHostname('127.0.0.1')).toBe(true);
    expect(isBlockedOutboundHostname('10.0.0.5')).toBe(true);
    expect(isBlockedOutboundHostname('192.168.1.10')).toBe(true);
    expect(isBlockedOutboundHostname('169.254.169.254')).toBe(true);
    expect(isBlockedOutboundHostname('metadata.google.internal')).toBe(true);
    expect(isBlockedOutboundHostname('service.local')).toBe(true);
  });

  it('allows public hostnames', () => {
    expect(isBlockedOutboundHostname('example.com')).toBe(false);
    expect(isBlockedOutboundHostname('api.github.com')).toBe(false);
  });

  it('rejects unsafe outbound URLs', () => {
    expect(isSafeOutboundUrl('http://127.0.0.1/health')).toBe(false);
    expect(isSafeOutboundUrl('https://169.254.169.254/latest/meta-data/')).toBe(
      false,
    );
    expect(isSafeOutboundUrl('ftp://example.com/file')).toBe(false);
    expect(isSafeOutboundUrl('https://user:pass@example.com/hook')).toBe(
      false,
    );
    expect(isSafeOutboundUrl('not-a-url')).toBe(false);
  });

  it('accepts public HTTPS URLs', () => {
    expect(isSafeOutboundUrl('https://example.com/webhook')).toBe(true);
    expect(isSafeOutboundUrl('http://example.com/health')).toBe(true);
  });

  it('throws for blocked URLs via assertSafeOutboundUrl', () => {
    expect(() => assertSafeOutboundUrl('http://127.0.0.1/')).toThrow(
      OutboundUrlError,
    );
  });
});
