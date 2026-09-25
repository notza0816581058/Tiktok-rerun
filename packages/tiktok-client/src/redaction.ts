/** Conservative field classification for sanitized research fixtures. */
export function placeholderForField(name: string): string | undefined {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key === 'roomid' || key === 'livesessionid') return '<ROOM_ID>';
  if (key === 'accountid') return '<ACCOUNT_ID>';
  if (key === 'creatorid') return '<CREATOR_ID>';
  if (key === 'cookie' || key === 'setcookie') return '<COOKIE>';
  if (key === 'authorization' || key === 'accesstoken' || key === 'refreshtoken') {
    return '<ACCESS_TOKEN>';
  }
  if (/(?:token|secret|password|session|csrf|signature|apikey|credential|auth)$/.test(key)) {
    return '<REDACTED>';
  }
  return undefined;
}

export function sanitizeFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeFields);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        placeholderForField(key) ?? sanitizeFields(item),
      ]),
    );
  }
  return value;
}

export interface LoggableRequest {
  method: string;
  url: string;
  headers: Readonly<Record<string, string>>;
  body?: string;
}

/** Use this before logging a materialized request. Paths and bodies may contain unknown private fields. */
export function redactRequestForLog(request: LoggableRequest): LoggableRequest {
  let origin: string;
  try {
    origin = new URL(request.url).origin;
  } catch {
    origin = '<REDACTED_ORIGIN>';
  }
  return {
    method: request.method,
    url: `${origin}/<REDACTED_PATH>`,
    headers: Object.fromEntries(
      Object.keys(request.headers).map((name) => [name, placeholderForField(name) ?? '<REDACTED>']),
    ),
    ...(request.body === undefined ? {} : { body: '<REDACTED_BODY>' }),
  };
}
