export type ProxyScheme = 'http' | 'https' | 'socks5' | 'socks5h';

export interface ProxyConfig {
  scheme: ProxyScheme;
  host: string;
  port: number;
}

/** Validates settings only. This package does not create a network agent or connect to a proxy. */
export function parseProxyConfig(input: string): ProxyConfig {
  if (typeof input !== 'string' || input.trim() !== input || input.length === 0) {
    throw new Error('Proxy URL must be a nonempty URL without surrounding whitespace.');
  }
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Proxy URL is invalid.');
  }
  const scheme = url.protocol.slice(0, -1);
  if (!['http', 'https', 'socks5', 'socks5h'].includes(scheme)) {
    throw new Error('Proxy scheme must be HTTP, HTTPS, SOCKS5, or SOCKS5H.');
  }
  if (
    !url.hostname ||
    url.username ||
    url.password ||
    !['', '/'].includes(url.pathname) ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'Proxy URL must contain only a host and port, without credentials, path, query, or fragment.',
    );
  }
  const defaultPort = scheme === 'https' ? 443 : scheme.startsWith('socks5') ? 1080 : 80;
  const port = url.port === '' ? defaultPort : Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Proxy port must be between 1 and 65535.');
  }
  return { scheme: scheme as ProxyScheme, host: url.hostname, port };
}
