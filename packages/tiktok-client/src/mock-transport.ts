import {
  mockAccountId,
  mockComments,
  mockLiveSessionId,
  mockProducts,
  mockStats,
} from './fixtures';
import type {
  AnyRequest,
  ClientErrorCode,
  ClientResult,
  Operation,
  OperationMap,
  RequestFor,
  TikTokTransport,
  Verification,
} from './types';

const verification: Verification = {
  status: 'pending_verification',
  reason: 'Mock fixture only. TikTok endpoint and response shape have not been verified.',
};

function success<T>(data: T): ClientResult<T> {
  return { ok: true, data, source: 'mock', verification };
}

function failure(code: ClientErrorCode, message: string): ClientResult<never> {
  return { ok: false, error: { code, message, retryable: false }, source: 'mock', verification };
}

function validAccount(payload: { accountId: string }): ClientResult<never> | null {
  return payload.accountId === mockAccountId
    ? null
    : failure('ACCOUNT_NOT_FOUND', 'The sample account does not exist.');
}

function validLive(payload: {
  accountId: string;
  liveSessionId: string;
}): ClientResult<never> | null {
  return (
    validAccount(payload) ??
    (payload.liveSessionId === mockLiveSessionId
      ? null
      : failure('LIVE_NOT_FOUND', 'The sample live session does not exist.'))
  );
}

/**
 * Deterministic, local-only transport for UI/API development. It has no fetch,
 * credentials, or side effects outside this module.
 */
export function createMockTransport(): TikTokTransport {
  const addedProducts = new Set<string>();

  return {
    async request<K extends Operation>(
      input: RequestFor<K>,
    ): Promise<ClientResult<OperationMap[K]['response']>> {
      // A discriminated union keeps the fixture switch exhaustive. The cast at
      // the edge bridges TypeScript's generic correlation limitation.
      const request = input as AnyRequest;
      let result: ClientResult<OperationMap[Operation]['response']>;

      switch (request.operation) {
        case 'auth.status': {
          result =
            validAccount(request.payload) ??
            success({
              accountId: mockAccountId,
              connection: 'not_connected' as const,
              displayName: 'Demo Account',
            });
          break;
        }
        case 'stats.live': {
          result = validLive(request.payload) ?? success({ ...mockStats });
          break;
        }
        case 'product.search': {
          const error = validAccount(request.payload);
          const query = request.payload.query.trim().toLowerCase();
          const limit = request.payload.limit ?? 20;
          result =
            error ??
            (limit < 1 || limit > 100
              ? failure('VALIDATION_ERROR', 'limit must be between 1 and 100.')
              : success({
                  products: mockProducts
                    .filter((product) => product.title.toLowerCase().includes(query))
                    .slice(0, limit)
                    .map((product) => ({ ...product })),
                  nextCursor: null,
                }));
          break;
        }
        case 'product.add':
        case 'product.pin': {
          const error = validLive(request.payload);
          const productExists = mockProducts.some(
            (product) => product.id === request.payload.productId,
          );
          if (error) {
            result = error;
          } else if (!productExists) {
            result = failure('PRODUCT_NOT_FOUND', 'The sample product does not exist.');
          } else if (
            request.operation === 'product.pin' &&
            !addedProducts.has(request.payload.productId)
          ) {
            result = failure('VALIDATION_ERROR', 'Add the sample product before pinning it.');
          } else {
            if (request.operation === 'product.add') addedProducts.add(request.payload.productId);
            result = success({
              accountId: request.payload.accountId,
              liveSessionId: request.payload.liveSessionId,
              productId: request.payload.productId,
              action: request.operation === 'product.add' ? ('add' as const) : ('pin' as const),
              execution: 'simulated' as const,
            });
          }
          break;
        }
        case 'comment.list': {
          result =
            validLive(request.payload) ??
            success({
              comments: mockComments.map((comment) => ({ ...comment })),
              nextCursor: null,
            });
          break;
        }
        case 'chat.send': {
          const error = validLive(request.payload);
          const text = request.payload.text.trim();
          result =
            error ??
            (!request.payload.requestId || !text || text.length > 500
              ? failure('VALIDATION_ERROR', 'requestId and 1–500 characters of text are required.')
              : success({
                  requestId: request.payload.requestId,
                  liveSessionId: request.payload.liveSessionId,
                  text,
                  execution: 'simulated' as const,
                }));
          break;
        }
        default: {
          const _exhaustive: never = request;
          throw new Error(`Unhandled mock operation: ${JSON.stringify(_exhaustive)}`);
        }
      }

      return result as ClientResult<OperationMap[K]['response']>;
    },
  };
}
