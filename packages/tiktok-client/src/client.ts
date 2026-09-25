import type { TikTokClient, TikTokTransport } from './types';

/** Domain facade. It does not know URLs, cookies, headers, or TikTok internals. */
export function createTikTokClient(transport: TikTokTransport): TikTokClient {
  return {
    auth: { status: (payload) => transport.request({ operation: 'auth.status', payload }) },
    stats: { live: (payload) => transport.request({ operation: 'stats.live', payload }) },
    products: {
      search: (payload) => transport.request({ operation: 'product.search', payload }),
      add: (payload) => transport.request({ operation: 'product.add', payload }),
      pin: (payload) => transport.request({ operation: 'product.pin', payload }),
    },
    comments: { list: (payload) => transport.request({ operation: 'comment.list', payload }) },
    chat: { send: (payload) => transport.request({ operation: 'chat.send', payload }) },
  };
}
