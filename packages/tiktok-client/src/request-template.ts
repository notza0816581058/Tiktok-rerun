import type { Verification } from './types';
import { placeholderForField, sanitizeFields } from './redaction';

export type BodyFormat = 'json' | 'form';

export interface RequestTemplate {
  method: string;
  origin: string;
  pathname: string;
  query: ReadonlyArray<{ name: string; value: string }>;
  headers: Readonly<Record<string, string>>;
  body?: string;
  bodyFormat?: BodyFormat;
  verification: Verification;
}

export interface TemplateValues {
  roomId?: string;
  accountId?: string;
  creatorId?: string;
  cookie?: string;
}

export interface PreparedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  /** Preparing a request is local only; it does not imply the endpoint is verified. */
  verification: Verification;
}

const pendingVerification: Verification = {
  status: 'pending_verification',
  reason: 'Sanitized research template only; endpoint and response are not verified.',
};

/** Tokenize a POSIX-style copied cURL command. Nothing is evaluated or executed. */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let token = '';
  let active = false;
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '\\' && quote !== "'") {
      const next = input[i + 1];
      if (next === '\r' && input[i + 2] === '\n') {
        i += 2;
        continue;
      }
      if (next === '\n') {
        i += 1;
        continue;
      }
      if (next === undefined) throw new Error('Incomplete cURL escape sequence.');
      token += next;
      active = true;
      i += 1;
      continue;
    }
    if (quote !== null) {
      if (char === quote) quote = null;
      else token += char;
      active = true;
    } else if (char === "'" || char === '"') {
      quote = char;
      active = true;
    } else if (/\s/.test(char)) {
      if (active) tokens.push(token);
      token = '';
      active = false;
    } else {
      token += char;
      active = true;
    }
  }
  if (quote !== null) throw new Error('Unclosed cURL quote.');
  if (active) tokens.push(token);
  return tokens;
}

function normalizeBody(
  body: string,
  contentType: string | undefined,
): { body: string; bodyFormat: BodyFormat } {
  const trimmed = body.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new Error('cURL JSON body is invalid.');
    }
    return { body: JSON.stringify(sanitizeFields(parsed)), bodyFormat: 'json' };
  }
  if (contentType?.toLowerCase().includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(body);
    const safe = new URLSearchParams();
    for (const [key, value] of params) safe.append(key, placeholderForField(key) ?? value);
    return { body: safe.toString(), bodyFormat: 'form' };
  }
  throw new Error('Only JSON and URL-encoded form bodies are supported for research templates.');
}

/** Parse a sanitized DevTools cURL sample into a local template. No network I/O occurs. */
export function parseSanitizedCurl(input: string): RequestTemplate {
  if (typeof input !== 'string' || input.length > 100_000)
    throw new Error('cURL sample is invalid or too large.');
  const tokens = tokenize(input);
  if (!/^(?:curl|curl\.exe)$/i.test(tokens[0] ?? ''))
    throw new Error('Sample must start with curl.');
  let urlText: string | undefined;
  let method: string | undefined;
  let body: string | undefined;
  const headers: Record<string, string> = {};

  function argument(index: number, inline?: string): { value: string; next: number } {
    const value = inline ?? tokens[index + 1];
    if (value === undefined || value.length === 0) throw new Error('Missing cURL option value.');
    return { value, next: inline === undefined ? index + 1 : index };
  }

  for (let i = 1; i < tokens.length; i += 1) {
    const item = tokens[i];
    const equalIndex = item.indexOf('=');
    const flag = equalIndex > 0 && item.startsWith('--') ? item.slice(0, equalIndex) : item;
    const inline = flag === item ? undefined : item.slice(equalIndex + 1);
    if (flag === '-X' || flag === '--request') {
      const result = argument(i, inline);
      method = result.value.toUpperCase();
      i = result.next;
    } else if (flag === '-H' || flag === '--header') {
      const result = argument(i, inline);
      i = result.next;
      const colon = result.value.indexOf(':');
      if (colon < 1) throw new Error('cURL header is invalid.');
      const name = result.value.slice(0, colon).trim().toLowerCase();
      const value = result.value.slice(colon + 1).trim();
      if (!/^[a-z0-9!#$%&'*+.^_`|~-]+$/.test(name) || Object.hasOwn(headers, name)) {
        throw new Error('cURL header name is invalid or duplicated.');
      }
      headers[name] =
        placeholderForField(name) ??
        (['accept', 'content-type', 'user-agent'].includes(name) ? value : '<REDACTED>');
    } else if (flag === '-b' || flag === '--cookie') {
      const result = argument(i, inline);
      i = result.next;
      if (Object.hasOwn(headers, 'cookie')) throw new Error('Cookie appears more than once.');
      headers.cookie = '<COOKIE>';
    } else if (['--data', '--data-raw', '--data-binary', '-d'].includes(flag)) {
      const result = argument(i, inline);
      i = result.next;
      if (body !== undefined) throw new Error('Multiple cURL bodies are unsupported.');
      body = result.value;
    } else if (flag === '--url') {
      const result = argument(i, inline);
      i = result.next;
      if (urlText !== undefined) throw new Error('Multiple cURL URLs are unsupported.');
      urlText = result.value;
    } else if (flag === '--compressed' || flag === '-L' || flag === '--location') {
      continue;
    } else if (item.startsWith('-')) {
      throw new Error('Unsupported cURL option in research template.');
    } else if (urlText === undefined) {
      urlText = item;
    } else {
      throw new Error('Multiple cURL URLs are unsupported.');
    }
  }

  if (urlText === undefined) throw new Error('cURL URL is missing.');
  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    throw new Error('cURL URL is invalid.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error('cURL URL must be HTTP(S), without embedded credentials or fragment.');
  }
  const normalizedMethod = method ?? (body === undefined ? 'GET' : 'POST');
  if (!/^(GET|POST|PUT|PATCH|DELETE|HEAD)$/.test(normalizedMethod)) {
    throw new Error('Unsupported HTTP method in research template.');
  }
  const query = Array.from(url.searchParams, ([name, value]) => ({
    name,
    value: placeholderForField(name) ?? value,
  }));
  const normalizedBody = body === undefined ? {} : normalizeBody(body, headers['content-type']);
  return {
    method: normalizedMethod,
    origin: url.origin,
    pathname: url.pathname.replace(/%3C(ROOM_ID|ACCOUNT_ID|CREATOR_ID)%3E/gi, '<$1>'),
    query,
    headers,
    ...normalizedBody,
    verification: pendingVerification,
  };
}

function replacePlaceholders(value: string, values: TemplateValues, encodeForPath = false): string {
  return value.replace(/<(ROOM_ID|ACCOUNT_ID|CREATOR_ID|COOKIE)>/g, (_match, key: string) => {
    const field = (
      {
        ROOM_ID: 'roomId',
        ACCOUNT_ID: 'accountId',
        CREATOR_ID: 'creatorId',
        COOKIE: 'cookie',
      } as const
    )[key as 'ROOM_ID' | 'ACCOUNT_ID' | 'CREATOR_ID' | 'COOKIE'];
    const replacement = values[field];
    if (typeof replacement !== 'string' || replacement.length === 0 || /[\r\n]/.test(replacement)) {
      throw new Error(`Missing or invalid value for ${key} placeholder.`);
    }
    return encodeForPath ? encodeURIComponent(replacement) : replacement;
  });
}

function fillJson(value: unknown, values: TemplateValues): unknown {
  if (Array.isArray(value)) return value.map((item) => fillJson(item, values));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fillJson(item, values)]),
    );
  }
  return typeof value === 'string' ? replacePlaceholders(value, values) : value;
}

/** Fill placeholders in memory only. The caller must never log or persist the returned cookie. */
export function substituteRequestTemplate(
  template: RequestTemplate,
  values: TemplateValues,
): PreparedRequest {
  const url = new URL(template.origin);
  url.pathname = replacePlaceholders(template.pathname, values, true);
  for (const { name, value } of template.query) {
    url.searchParams.append(name, replacePlaceholders(value, values));
  }
  const headers = Object.fromEntries(
    Object.entries(template.headers).map(([name, value]) => [
      name,
      replacePlaceholders(value, values),
    ]),
  );
  let body: string | undefined;
  if (template.body !== undefined && template.bodyFormat === 'json') {
    body = JSON.stringify(fillJson(JSON.parse(template.body), values));
  } else if (template.body !== undefined && template.bodyFormat === 'form') {
    const params = new URLSearchParams(template.body);
    const filled = new URLSearchParams();
    for (const [name, value] of params) filled.append(name, replacePlaceholders(value, values));
    body = filled.toString();
  }
  return {
    method: template.method,
    url: url.toString(),
    headers,
    ...(body === undefined ? {} : { body }),
    verification: template.verification,
  };
}
