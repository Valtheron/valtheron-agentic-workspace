import { describe, it, expect } from 'vitest';
import { ipIsPrivate, assertSafeUrl, BrowseError } from '../services/urlGuard.js';

describe('ipIsPrivate', () => {
  it('flags loopback / private / link-local / CGNAT', () => {
    for (const ip of [
      '127.0.0.1',
      '10.0.0.1',
      '192.168.1.1',
      '172.16.0.1',
      '172.31.255.255',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      'fd00::1',
      'fe80::1',
    ]) {
      expect(ipIsPrivate(ip), ip).toBe(true);
    }
  });
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '2606:4700:4700::1111']) {
      expect(ipIsPrivate(ip), ip).toBe(false);
    }
  });
});

describe('assertSafeUrl (no DNS paths)', () => {
  it('rejects non-http(s) protocols', async () => {
    await expect(assertSafeUrl('ftp://example.com/')).rejects.toBeInstanceOf(BrowseError);
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toBeInstanceOf(BrowseError);
  });
  it('rejects localhost and private literal IPs', async () => {
    await expect(assertSafeUrl('http://localhost/')).rejects.toBeInstanceOf(BrowseError);
    await expect(assertSafeUrl('http://127.0.0.1/')).rejects.toBeInstanceOf(BrowseError);
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data/')).rejects.toBeInstanceOf(BrowseError);
    await expect(assertSafeUrl('http://192.168.0.1/')).rejects.toBeInstanceOf(BrowseError);
  });
  it('allows a public literal IP', async () => {
    const u = await assertSafeUrl('http://8.8.8.8/');
    expect(u.hostname).toBe('8.8.8.8');
  });
  it('enforces the allowlist before any network access', async () => {
    await expect(assertSafeUrl('http://evil.example.org/', { allowlist: ['example.com'] })).rejects.toBeInstanceOf(
      BrowseError,
    );
    // subdomain of an allowed domain (literal IP host avoids DNS in this unit test)
    const u = await assertSafeUrl('http://8.8.8.8/', { allowlist: ['8.8.8.8'] });
    expect(u.hostname).toBe('8.8.8.8');
  });
  it('rejects malformed URLs', async () => {
    await expect(assertSafeUrl('not a url')).rejects.toBeInstanceOf(BrowseError);
  });
});
