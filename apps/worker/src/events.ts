import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateEvent } = require('@live-hub/shared') as typeof import('@live-hub/shared');

export const eventChannel = 'livehub:events:v1';

export function decodeEvent(message: string): { ok: true; eventId: string; eventType: string } | { ok: false } {
  try {
    const parsed = validateEvent(JSON.parse(message));
    return parsed.success ? { ok: true, eventId: parsed.data.eventId, eventType: parsed.data.eventType } : { ok: false };
  } catch {
    return { ok: false };
  }
}
