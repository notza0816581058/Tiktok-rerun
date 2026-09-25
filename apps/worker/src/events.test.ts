import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { decodeEvent } from './events.js';

const require = createRequire(import.meta.url);
const { createMockEvent } = require('@live-hub/shared') as typeof import('@live-hub/shared');

test('worker accepts only validated shared event envelopes', () => {
  const valid = createMockEvent('live.started', {
    accountId: 'demo-account',
    roomId: 'demo-room',
    streamStartedAt: '2026-09-25T08:00:00.000Z',
  });
  assert.deepEqual(decodeEvent(JSON.stringify(valid)), {
    ok: true,
    eventId: valid.eventId,
    eventType: 'live.started',
  });
  assert.deepEqual(decodeEvent('{bad json'), { ok: false });
  assert.deepEqual(decodeEvent(JSON.stringify({ ...valid, schemaVersion: 999 })), { ok: false });
});
