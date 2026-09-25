import { createRequire } from 'node:module';
import { createClient } from 'redis';

const require = createRequire(import.meta.url);
const { createMockEvent } = require('@live-hub/shared') as typeof import('@live-hub/shared');
async function main() {
  const event = createMockEvent('live.started', {
    accountId: 'demo-account',
    roomId: 'demo-room',
    streamStartedAt: new Date().toISOString(),
  });
  const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6380' });
  redis.on('error', (error) => console.error('Redis error:', error.message));
  try {
    await redis.connect();
    const subscribers = await redis.publish('livehub:events:v1', JSON.stringify(event));
    console.log(`Published ${event.eventType} (${event.eventId}) to ${subscribers} subscriber(s)`);
  } finally {
    if (redis.isOpen) await redis.quit();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
