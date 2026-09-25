/** Proposed internal contracts. Platform responses must be mapped before publishing. */
export const EVENT_SCHEMA_VERSION = 1 as const;

export type EventSource = "mock" | "tiktok" | "internal";

export interface ViewerRef {
  id: string;
  displayName: string;
}

export interface ProductRef {
  productId: string;
  title: string;
}

export type OperationStatus = "success" | "error" | "pending_verification";

export interface ContractError {
  code: string;
  message: string;
}

export interface EventPayloads {
  "comment.received": {
    commentId: string;
    viewer: ViewerRef;
    text: string;
  };
  "viewer.entered": {
    viewer: ViewerRef;
  };
  "reaction.liked": {
    viewer: ViewerRef;
    count: number;
  };
  "gift.received": {
    viewer: ViewerRef;
    giftId: string;
    giftName: string;
    quantity: number;
  };
  "stats.updated": {
    viewers: number;
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
  "product.searched": {
    query: string;
    results: ProductRef[];
    status: OperationStatus;
    error?: ContractError;
  };
  "product.added": {
    productId: string;
    status: OperationStatus;
    error?: ContractError;
  };
  "product.pinned": {
    productId: string;
    status: OperationStatus;
    error?: ContractError;
  };
  "chat.send.requested": {
    requestId: string;
    text: string;
  };
  "chat.sent": {
    requestId: string;
    platformMessageId?: string;
  };
  "chat.failed": {
    requestId: string;
    error: ContractError;
  };
}

export type EventType = keyof EventPayloads;

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
  | { success: true; data: LiveEvent }
  | { success: false; issues: ValidationIssue[] };
