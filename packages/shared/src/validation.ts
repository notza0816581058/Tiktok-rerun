import {
  CORE_EVENT_TYPES,
  EVENT_TYPES,
  EVENT_SCHEMA_VERSION,
  type EventType,
  type LiveEvent,
  type ValidationIssue,
  type ValidationResult,
} from './types';

type JsonObject = Record<string, unknown>;
const KNOWN_EVENT_TYPES = new Set<EventType>(EVENT_TYPES);
const CORE_EVENTS = new Set<EventType>(CORE_EVENT_TYPES);

const LIVE_SESSION_EVENTS = new Set<EventType>([
  'live.started',
  'live.stopped',
  'live.error',
  'comment.received',
  'viewer.entered',
  'reaction.liked',
  'gift.received',
  'stats.updated',
  'product.added',
  'product.pinned',
  'chat.send.request',
  'chat.sent',
  'chat.failed',
]);

function objectAt(value: unknown, path: string, issues: ValidationIssue[]): JsonObject | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    issues.push({ path, message: 'must be an object' });
    return undefined;
  }
  return value as JsonObject;
}

function keysOf(
  value: JsonObject,
  allowed: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      issues.push({ path: `${path}.${key}`, message: 'unknown field' });
    }
  }
}

function stringAt(value: unknown, path: string, issues: ValidationIssue[], maxLength = 128): void {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    issues.push({ path, message: `must be a nonempty string of at most ${maxLength} characters` });
  }
}

function optionalStringAt(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  maxLength = 128,
): void {
  if (value !== undefined) stringAt(value, path, issues, maxLength);
}

function nonnegativeAt(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  integer = true,
): void {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (integer && !Number.isSafeInteger(value))
  ) {
    issues.push({
      path,
      message: integer
        ? 'must be a nonnegative safe integer'
        : 'must be a nonnegative finite number',
    });
  }
}

function isoDateAt(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    issues.push({ path, message: 'must be an ISO 8601 date-time with timezone' });
  }
}

function viewerAt(value: unknown, path: string, issues: ValidationIssue[]): void {
  const viewer = objectAt(value, path, issues);
  if (!viewer) return;
  keysOf(viewer, ['id', 'displayName'], path, issues);
  stringAt(viewer.id, `${path}.id`, issues);
  stringAt(viewer.displayName, `${path}.displayName`, issues, 160);
}

function errorAt(value: unknown, path: string, issues: ValidationIssue[]): void {
  const error = objectAt(value, path, issues);
  if (!error) return;
  keysOf(error, ['code', 'message'], path, issues);
  stringAt(error.code, `${path}.code`, issues);
  stringAt(error.message, `${path}.message`, issues, 500);
}

function operationAt(value: JsonObject, path: string, issues: ValidationIssue[]): void {
  if (!['success', 'error', 'pending_verification'].includes(value.status as string)) {
    issues.push({
      path: `${path}.status`,
      message: 'must be success, error, or pending_verification',
    });
  }
  if (value.status === 'error') {
    errorAt(value.error, `${path}.error`, issues);
  } else if (value.error !== undefined) {
    issues.push({ path: `${path}.error`, message: 'allowed only when status is error' });
  }
}

function payloadAt(
  eventType: EventType,
  value: unknown,
  accountId: unknown,
  issues: ValidationIssue[],
): void {
  const payload = objectAt(value, 'payload', issues);
  if (!payload) return;
  if (CORE_EVENTS.has(eventType)) {
    stringAt(payload.accountId, 'payload.accountId', issues);
    if (
      typeof payload.accountId === 'string' &&
      typeof accountId === 'string' &&
      payload.accountId !== accountId
    ) {
      issues.push({ path: 'payload.accountId', message: 'must match event.accountId' });
    }
  }

  switch (eventType) {
    case 'live.starting':
      keysOf(payload, ['accountId', 'roomId'], 'payload', issues);
      optionalStringAt(payload.roomId, 'payload.roomId', issues);
      return;
    case 'live.started':
      keysOf(payload, ['accountId', 'roomId', 'streamStartedAt'], 'payload', issues);
      stringAt(payload.roomId, 'payload.roomId', issues);
      isoDateAt(payload.streamStartedAt, 'payload.streamStartedAt', issues);
      return;
    case 'live.stopped':
      keysOf(payload, ['accountId', 'reason'], 'payload', issues);
      stringAt(payload.reason, 'payload.reason', issues, 500);
      return;
    case 'live.error':
      keysOf(payload, ['accountId', 'error'], 'payload', issues);
      errorAt(payload.error, 'payload.error', issues);
      return;
    case 'comment.received':
      keysOf(payload, ['accountId', 'commentId', 'user', 'text', 'type'], 'payload', issues);
      optionalStringAt(payload.commentId, 'payload.commentId', issues);
      viewerAt(payload.user, 'payload.user', issues);
      stringAt(payload.text, 'payload.text', issues, 2000);
      if (!['comment', 'enter', 'like', 'gift'].includes(payload.type as string)) {
        issues.push({ path: 'payload.type', message: 'must be comment, enter, like, or gift' });
      }
      return;
    case 'viewer.entered':
      keysOf(payload, ['viewer'], 'payload', issues);
      viewerAt(payload.viewer, 'payload.viewer', issues);
      return;
    case 'reaction.liked':
      keysOf(payload, ['viewer', 'count'], 'payload', issues);
      viewerAt(payload.viewer, 'payload.viewer', issues);
      nonnegativeAt(payload.count, 'payload.count', issues);
      return;
    case 'gift.received':
      keysOf(payload, ['viewer', 'giftId', 'giftName', 'quantity'], 'payload', issues);
      viewerAt(payload.viewer, 'payload.viewer', issues);
      stringAt(payload.giftId, 'payload.giftId', issues);
      stringAt(payload.giftName, 'payload.giftName', issues, 160);
      nonnegativeAt(payload.quantity, 'payload.quantity', issues);
      return;
    case 'stats.updated':
      keysOf(
        payload,
        [
          'accountId',
          'viewers',
          'sold',
          'enters',
          'likes',
          'comments',
          'gifts',
          'impressions',
          'gmv',
          'currency',
          'gmvPerHour',
          'impressionsPerHour',
        ],
        'payload',
        issues,
      );
      for (const field of [
        'viewers',
        'sold',
        'enters',
        'likes',
        'comments',
        'impressions',
        'gmv',
        'gmvPerHour',
        'impressionsPerHour',
      ] as const) {
        nonnegativeAt(
          payload[field],
          `payload.${field}`,
          issues,
          field !== 'gmv' && field !== 'gmvPerHour',
        );
      }
      if (payload.gifts !== undefined) nonnegativeAt(payload.gifts, 'payload.gifts', issues);
      if (typeof payload.currency !== 'string' || !/^[A-Z]{3}$/.test(payload.currency)) {
        issues.push({
          path: 'payload.currency',
          message: 'must be a three-letter uppercase currency code',
        });
      }
      return;
    case 'product.searched':
      keysOf(payload, ['query', 'results', 'status', 'error'], 'payload', issues);
      stringAt(payload.query, 'payload.query', issues, 200);
      if (!Array.isArray(payload.results) || payload.results.length > 100) {
        issues.push({
          path: 'payload.results',
          message: 'must be an array of at most 100 products',
        });
      } else {
        payload.results.forEach((item, index) => {
          const product = objectAt(item, `payload.results[${index}]`, issues);
          if (!product) return;
          keysOf(product, ['productId', 'title'], `payload.results[${index}]`, issues);
          stringAt(product.productId, `payload.results[${index}].productId`, issues);
          stringAt(product.title, `payload.results[${index}].title`, issues, 250);
        });
      }
      operationAt(payload, 'payload', issues);
      return;
    case 'product.added':
    case 'product.pinned':
      keysOf(payload, ['productId', 'status', 'error'], 'payload', issues);
      stringAt(payload.productId, 'payload.productId', issues);
      operationAt(payload, 'payload', issues);
      return;
    case 'chat.send.request':
      keysOf(payload, ['accountId', 'requestId', 'text'], 'payload', issues);
      stringAt(payload.requestId, 'payload.requestId', issues);
      stringAt(payload.text, 'payload.text', issues, 1000);
      return;
    case 'chat.sent':
      keysOf(payload, ['accountId', 'requestId', 'platformMessageId'], 'payload', issues);
      stringAt(payload.requestId, 'payload.requestId', issues);
      optionalStringAt(payload.platformMessageId, 'payload.platformMessageId', issues);
      return;
    case 'chat.failed':
      keysOf(payload, ['accountId', 'requestId', 'error'], 'payload', issues);
      stringAt(payload.requestId, 'payload.requestId', issues);
      errorAt(payload.error, 'payload.error', issues);
      return;
  }
}

export function validateEvent(value: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const event = objectAt(value, 'event', issues);
  if (!event) return { success: false, issues };

  keysOf(
    event,
    [
      'schemaVersion',
      'eventId',
      'eventType',
      'occurredAt',
      'source',
      'accountId',
      'sessionId',
      'correlationId',
      'payload',
    ],
    'event',
    issues,
  );
  if (event.schemaVersion !== EVENT_SCHEMA_VERSION) {
    issues.push({ path: 'event.schemaVersion', message: `must equal ${EVENT_SCHEMA_VERSION}` });
  }
  stringAt(event.eventId, 'event.eventId', issues);
  isoDateAt(event.occurredAt, 'event.occurredAt', issues);
  if (!['mock', 'tiktok', 'internal'].includes(event.source as string)) {
    issues.push({ path: 'event.source', message: 'must be mock, tiktok, or internal' });
  }
  stringAt(event.accountId, 'event.accountId', issues);
  optionalStringAt(event.sessionId, 'event.sessionId', issues);
  optionalStringAt(event.correlationId, 'event.correlationId', issues);

  if (typeof event.eventType !== 'string' || !KNOWN_EVENT_TYPES.has(event.eventType as EventType)) {
    issues.push({ path: 'event.eventType', message: 'unsupported event type' });
  } else {
    const eventType = event.eventType as EventType;
    if (LIVE_SESSION_EVENTS.has(eventType) && event.sessionId === undefined) {
      issues.push({ path: 'event.sessionId', message: 'required for live session events' });
    }
    payloadAt(eventType, event.payload, event.accountId, issues);
  }

  return issues.length === 0
    ? { success: true, data: event as unknown as LiveEvent }
    : { success: false, issues };
}

export function isLiveEvent(value: unknown): value is LiveEvent {
  return validateEvent(value).success;
}

export class ContractValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super(`Invalid event: ${issues.map((issue) => `${issue.path} ${issue.message}`).join('; ')}`);
    this.name = 'ContractValidationError';
  }
}

export function parseEvent(value: unknown): LiveEvent {
  const result = validateEvent(value);
  if (!result.success) throw new ContractValidationError(result.issues);
  return result.data;
}
