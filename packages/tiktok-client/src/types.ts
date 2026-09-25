/** The adapter contract. Endpoint names and payloads await verification by C/Phum. */
export type Verification =
  | { status: 'pending_verification'; reason: string }
  | { status: 'verified'; evidenceRef: string; verifiedAt: string };

export type ClientErrorCode =
  | 'ACCOUNT_NOT_FOUND'
  | 'LIVE_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'TRANSPORT_ERROR';

export type ClientResult<T> =
  | { ok: true; data: T; source: 'mock' | 'integration'; verification: Verification }
  | {
      ok: false;
      error: { code: ClientErrorCode; message: string; retryable: boolean };
      source: 'mock' | 'integration';
      verification: Verification;
    };

export interface AccountRequest {
  accountId: string;
}

export interface LiveRequest extends AccountRequest {
  liveSessionId: string;
}

export interface AuthStatus {
  accountId: string;
  connection: 'not_connected' | 'connected';
  displayName?: string;
}

export interface LiveStats {
  accountId: string;
  liveSessionId: string;
  capturedAt: string;
  viewers: number;
  sold: number;
  likes: number;
  comments: number;
  enters: number;
  impressions: number;
  gmv: number;
  gmvPerHour: number;
  impressionsPerHour: number;
  currency: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

export interface ProductSearchRequest extends AccountRequest {
  query: string;
  limit?: number;
}

export interface ProductSearchResult {
  products: Product[];
  nextCursor: string | null;
}

export interface ProductActionRequest extends LiveRequest {
  productId: string;
}

/** A mock action never changes a TikTok live session. */
export interface ProductActionResult {
  accountId: string;
  liveSessionId: string;
  productId: string;
  action: 'add' | 'pin';
  execution: 'simulated' | 'submitted';
}

export interface Comment {
  id: string;
  liveSessionId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CommentListResult {
  comments: Comment[];
  nextCursor: string | null;
}

export interface ChatSendRequest extends LiveRequest {
  requestId: string;
  text: string;
}

/** The mock result is simulated; a future adapter must supply delivery evidence. */
export interface ChatSendResult {
  requestId: string;
  liveSessionId: string;
  text: string;
  execution: 'simulated' | 'submitted';
}

export interface OperationMap {
  'auth.status': { request: AccountRequest; response: AuthStatus };
  'stats.live': { request: LiveRequest; response: LiveStats };
  'product.search': { request: ProductSearchRequest; response: ProductSearchResult };
  'product.add': { request: ProductActionRequest; response: ProductActionResult };
  'product.pin': { request: ProductActionRequest; response: ProductActionResult };
  'comment.list': { request: LiveRequest; response: CommentListResult };
  'chat.send': { request: ChatSendRequest; response: ChatSendResult };
}

export type Operation = keyof OperationMap;
export type RequestFor<K extends Operation> = {
  operation: K;
  payload: OperationMap[K]['request'];
};
export type AnyRequest = {
  [K in Operation]: RequestFor<K>;
}[Operation];

/** Inject a transport here after the relevant endpoint and contract are verified. */
export interface TikTokTransport {
  request<K extends Operation>(
    request: RequestFor<K>,
  ): Promise<ClientResult<OperationMap[K]['response']>>;
}

export interface TikTokClient {
  auth: { status(request: AccountRequest): Promise<ClientResult<AuthStatus>> };
  stats: { live(request: LiveRequest): Promise<ClientResult<LiveStats>> };
  products: {
    search(request: ProductSearchRequest): Promise<ClientResult<ProductSearchResult>>;
    add(request: ProductActionRequest): Promise<ClientResult<ProductActionResult>>;
    pin(request: ProductActionRequest): Promise<ClientResult<ProductActionResult>>;
  };
  comments: { list(request: LiveRequest): Promise<ClientResult<CommentListResult>> };
  chat: { send(request: ChatSendRequest): Promise<ClientResult<ChatSendResult>> };
}
