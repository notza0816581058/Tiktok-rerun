import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from './app.js';

test('health reports dependencies ready when all checks succeed', async () => {
  const app = createApp({ postgres: async () => {}, redis: async () => {}, worker: async () => true });
  const result = await app.inject('/health/ready');
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.json().dependencies, { postgres: 'ready', redis: 'ready', worker: 'ready' });
  await app.close();
});

test('health reports degraded without leaking connection errors', async () => {
  const app = createApp({ postgres: async () => { throw new Error('private URL'); }, redis: async () => {}, worker: async () => false });
  const result = await app.inject('/health/ready');
  assert.equal(result.statusCode, 503);
  assert.equal(result.json().status, 'degraded');
  assert.equal(result.body.includes('private URL'), false);
  await app.close();
});

test('mock stats map into a validated shared event', async () => {
  const app = createApp({ postgres: async () => {}, redis: async () => {}, worker: async () => true });
  const result = await app.inject('/api/v1/mock/live-stats');
  assert.equal(result.statusCode, 200);
  assert.equal(result.json().source, 'mock');
  assert.equal(result.json().verification.status, 'pending_verification');
  assert.equal(result.json().event.eventType, 'stats.updated');
  assert.equal(result.json().contract, 'valid');
  await app.close();
});
