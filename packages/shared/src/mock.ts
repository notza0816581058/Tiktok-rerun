import { EVENT_SCHEMA_VERSION, type EventOf, type EventPayloads, type EventType } from "./types";
import { parseEvent } from "./validation";

export interface MockEventOptions {
  eventId?: string;
  occurredAt?: string;
  accountId?: string;
  sessionId?: string;
  correlationId?: string;
}

let nextMockId = 1;

/** Creates a validated internal event for local UI, API, and worker fixtures. */
export function createMockEvent<K extends EventType>(
  eventType: K,
  payload: EventPayloads[K],
  options: MockEventOptions = {},
): EventOf<K> {
  const event = {
    schemaVersion: EVENT_SCHEMA_VERSION,
    eventId: options.eventId ?? `mock-event-${nextMockId++}`,
    eventType,
    occurredAt: options.occurredAt ?? new Date().toISOString(),
    source: "mock" as const,
    accountId: options.accountId ?? "mock-account",
    sessionId: options.sessionId ?? "mock-session",
    ...(options.correlationId === undefined ? {} : { correlationId: options.correlationId }),
    payload,
  };
  return parseEvent(event) as EventOf<K>;
}
