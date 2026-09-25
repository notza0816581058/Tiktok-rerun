import assert from 'node:assert/strict';
import test from 'node:test';
import { heartbeatKey, writeHeartbeat } from './heartbeat.js';

test('worker heartbeat expires if the process stops', async () => {
  let recorded: unknown;
  await writeHeartbeat(
    {
      set: async (...args) => {
        recorded = args;
      },
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
  assert.deepEqual(recorded, [heartbeatKey, '2026-01-01T00:00:00.000Z', { EX: 30 }]);
});
