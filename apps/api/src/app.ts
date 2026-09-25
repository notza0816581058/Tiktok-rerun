import Fastify from 'fastify';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createMockEvent, validateEvent } = require('@live-hub/shared') as typeof import('@live-hub/shared');
const { createTikTokClient, createMockTransport, mockAccountId, mockLiveSessionId } = require('@live-hub/tiktok-client') as typeof import('@live-hub/tiktok-client');
const mockClient = createTikTokClient(createMockTransport());

export type HealthDependencies = {
  postgres: () => Promise<void>;
  redis: () => Promise<void>;
  worker: () => Promise<boolean>;
};

export function createApp(deps: HealthDependencies) {
  const app = Fastify({ logger: false });

  app.get('/health/live', async () => ({ status: 'alive', service: 'api' }));

  app.get('/health/ready', async (_request, reply) => {
    const [postgres, redis, worker] = await Promise.allSettled([
      deps.postgres(), deps.redis(), deps.worker(),
    ]);
    const services = {
      postgres: postgres.status === 'fulfilled' ? 'ready' : 'unavailable',
      redis: redis.status === 'fulfilled' ? 'ready' : 'unavailable',
      worker: worker.status === 'fulfilled' && worker.value ? 'ready' : 'unavailable',
    } as const;
    const status = Object.values(services).every(value => value === 'ready') ? 'ready' : 'degraded';
    if (status === 'degraded') reply.status(503);
    return { status, service: 'api', dependencies: services };
  });

  app.get('/api/v1/integrations', async () => ({
    items: [
      { name: 'tiktok-auth', status: 'pending_verification', owner: 'Nott' },
      { name: 'live-stats', status: 'pending_verification', owner: 'C' },
      { name: 'product-search-add-pin', status: 'pending_verification', owner: 'C' },
      { name: 'comment-chat', status: 'pending_contract', owner: 'Phum' },
    ],
  }));

  app.get('/api/v1/mock/live-stats', async () => {
    const result = await mockClient.stats.live({ accountId: mockAccountId, liveSessionId: mockLiveSessionId });
    if (!result.ok) return result;
    const stats = result.data;
    const event = createMockEvent('stats.updated', {
      viewers: stats.viewers,
      enters: stats.enters,
      likes: stats.likes,
      comments: stats.comments,
      impressions: stats.impressions,
      gmv: stats.gmv,
      currency: stats.currency,
      gmvPerHour: stats.gmvPerHour,
      impressionsPerHour: stats.impressionsPerHour,
    }, { accountId: stats.accountId, sessionId: stats.liveSessionId });
    return { ...result, event, contract: validateEvent(event).success ? 'valid' : 'invalid' };
  });

  app.get('/api/v1/mock/products', async () => mockClient.products.search({ accountId: mockAccountId, query: 'demo' }));

  return app;
}
