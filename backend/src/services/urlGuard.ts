// SSRF guard for server-side web browsing. Server-initiated requests to
// attacker-controlled URLs are a classic SSRF vector (reaching cloud metadata
// endpoints, internal services, localhost). Every URL an agent/user asks the
// backend to browse MUST pass through assertSafeUrl() first.

import dns from 'node:dns';
import net from 'node:net';

export class BrowseError extends Error {}

/** True for loopback / private / link-local / CGNAT / IPv4-mapped ranges. */
export function ipIsPrivate(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
    return false;
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase().replace(/^\[|\]$/g, '');
    if (l === '::1' || l === '::') return true;
    if (l.startsWith('fc') || l.startsWith('fd')) return true; // ULA fc00::/7
    if (l.startsWith('fe80')) return true; // link-local
    if (l.startsWith('::ffff:')) return ipIsPrivate(l.slice('::ffff:'.length)); // IPv4-mapped
    return false;
  }
  return false;
}

export interface UrlGuardOptions {
  /** When non-empty, the host must equal or be a subdomain of one of these. */
  allowlist?: string[];
}

/**
 * Validate a URL for safe server-side browsing. Throws BrowseError on any
 * violation; returns the parsed URL otherwise.
 */
export async function assertSafeUrl(raw: string, opts: UrlGuardOptions = {}): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BrowseError('Ungültige URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BrowseError('Nur http/https-URLs sind erlaubt.');
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new BrowseError('Lokale Hosts sind blockiert (SSRF-Schutz).');
  }

  const allowlist = (opts.allowlist ?? []).filter(Boolean);
  if (allowlist.length > 0) {
    const ok = allowlist.some((d) => host === d.toLowerCase() || host.endsWith('.' + d.toLowerCase()));
    if (!ok) throw new BrowseError(`Domain nicht in der Allowlist: ${host}`);
  }

  // Literal IP in the host → check directly.
  if (net.isIP(host)) {
    if (ipIsPrivate(host)) throw new BrowseError('Private/lokale IP-Adressen sind blockiert (SSRF-Schutz).');
    return url;
  }

  // Hostname → resolve and reject if ANY address is private (DNS-rebinding aware).
  let addrs: { address: string }[];
  try {
    addrs = await dns.promises.lookup(host, { all: true });
  } catch {
    throw new BrowseError(`DNS-Auflösung fehlgeschlagen: ${host}`);
  }
  for (const a of addrs) {
    if (ipIsPrivate(a.address)) {
      throw new BrowseError('Host löst auf eine private/lokale Adresse auf (SSRF-Schutz).');
    }
  }
  return url;
}
