/** Proposed internal contracts. Platform responses must be mapped before publishing. */
export const EVENT_SCHEMA_VERSION = 1 as const;

export type EventSource = 'mock' | 'tiktok' | 'internal';

export interface ViewerRef {
  id: string;
  displayName: string;
}

export interface ProductRef {
  productId: string;
  title: string;
}

export type OperationStatus = 'success' | 'error' | 'pending_verification';

export interface ContractError {
  code: string;
  message: string;
}

export type CommentActivityType = 'comment' | 'enter' | 'like' | 'gift';

export interface EventPayloads {
  'live.starting': {
    accountId: string;
    roomId?: string;
  };
  'live.started': {
    accountId: string;
    roomId: string;
    streamStartedAt: string;
  };
  'live.stopped': {
    accountId: string;
    reason: string;
  };
  'live.error': {
    accountId: string;
    error: ContractError;
  };
  'comment.received': {
    accountId: string;
    commentId?: string;
    user: ViewerRef;
    text: string;
    type: CommentActivityType;
  };
  'viewer.entered': {
    viewer: ViewerRef;
  };
  'reaction.liked': {
    viewer: ViewerRef;
    count: number;
  };
  'gift.received': {
    viewer: ViewerRef;
    giftId: string;
    giftName: string;
    quantity: number;
  };
  'stats.updated': {
    accountId: string;
    viewers: number;
    sold: number;
    enters: number;
    likes: number;
    comments: number;
    gifts?: number;
    impressions: number;
    gmv: number;
    currency: string;
    gmvPerHour: number;
    impressionsPerHour: number;
  };
  'product.searched': {
    query: string;
    results: ProductRef[];
    status: OperationStatus;
    error?: ContractError;
  };
  'product.added': {
    productId: string;
    status: OperationStatus;
    error?: ContractError;
  };
  'product.pinned': {
    productId: string;
    status: OperationStatus;
    error?: ContractError;
  };
  'chat.send.request': {
    accountId: string;
    requestId: string;
    text: string;
  };
  'chat.sent': {
    accountId: string;
    requestId: string;
    platformMessageId?: string;
  };
  'chat.failed': {
    accountId: string;
    requestId: string;
    error: ContractError;
  };
}

export type EventType = keyof EventPayloads;

/** Required names from the team's shared contract. Other names are extensions. */
export const CORE_EVENT_TYPES = [
  'live.starting',
  'live.started',
  'live.stopped',
  'live.error',
  'stats.updated',
  'comment.received',
  'chat.send.request',
  'chat.sent',
  'chat.failed',
] as const satisfies readonly EventType[];

export const EVENT_TYPES = [
  ...CORE_EVENT_TYPES,
  'viewer.entered',
  'reaction.liked',
  'gift.received',
  'product.searched',
  'product.added',
  'product.pinned',
] as const satisfies readonly EventType[];

export interface EventEnvelope<K extends EventType> {
  schemaVersion: typeof EVENT_SCHEMA_VERSION;
  eventId: string;
  eventType: K;
  occurredAt: string;
  source: EventSource;
  accountId: string;
  sessionId?: string;
  correlationId?: string;
  payload: EventPayloads[K];
}

export type EventOf<K extends EventType> = EventEnvelope<K>;
export type LiveEvent = { [K in EventType]: EventOf<K> }[EventType];

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult =
  { success: true; data: LiveEvent } | { success: false; issues: ValidationIssue[] };
