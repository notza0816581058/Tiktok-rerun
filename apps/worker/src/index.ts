import { createClient } from 'redis';
import { writeHeartbeat } from './heartbeat.js';
import { decodeEvent, eventChannel } from './events.js';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6380';
const redis = createClient({ url: redisUrl });
redis.on('error', (error) => console.error('Worker Redis connection error:', error.message));
await redis.connect();
await writeHeartbeat(redis);
const subscriber = redis.duplicate();
subscriber.on('error', (error) => console.error('Worker event subscription error:', error.message));
await subscriber.connect();
await subscriber.subscribe(eventChannel, (message) => {
  const event = decodeEvent(message);
  if (event.ok)
    console.log(`Accepted ${event.eventType} (${event.eventId}); processing adapter pending`);
  else console.warn('Rejected an invalid event envelope');
});
const interval = setInterval(() => {
  void writeHeartbeat(redis).catch((error) => console.error('Heartbeat failed:', error));
}, 10000);
console.log(
  'Worker heartbeat started; platform actions are disabled until verified contracts are connected.',
);
async function shutdown() {
  clearInterval(interval);
  await subscriber.quit();
  await redis.del('livehub:worker:heartbeat');
  await redis.quit();
}
process.once('SIGINT', () => {
  void shutdown();
});
process.once('SIGTERM', () => {
  void shutdown();
});
