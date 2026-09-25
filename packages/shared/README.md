# @live-hub/shared

Shared TypeScript event contracts for the Live Hub API, worker, and UI. This is the proposed P0-4 contract for mock development. It does not contain TikTok credentials, cookies, raw platform responses, or verified endpoint definitions.

## Monorepo setup

The root `package.json` should declare `"workspaces": ["apps/*", "packages/*"]`. Consumers should declare `"@live-hub/shared": "0.2.0"` in their `dependencies`. From the repository root, run `npm install`, then `npm run build -w @live-hub/shared`. The package is private and linked by npm workspaces; no external registry publish is needed.

Run `npm test -w @live-hub/shared` to compile and run the mock fixture tests.

## Event shape

Every event has `schemaVersion: 1`, `eventId`, `eventType`, `occurredAt` (ISO timestamp with timezone), `source`, `accountId`, an optional `correlationId`, and a typed `payload`. Live session events also require `sessionId`. `product.searched` may be published before a live session starts, so its `sessionId` is optional.

| Event type | Main payload |
| --- | --- |
| `comment.received` | `commentId`, `viewer`, `text` |
| `viewer.entered` | `viewer` |
| `reaction.liked` | `viewer`, `count` |
| `gift.received` | `viewer`, `giftId`, `giftName`, `quantity` |
| `stats.updated` | normalized counts, GMV, hourly metrics, currency; optional gifts count until verified |
| `product.searched` | `query`, `results`, operation status |
| `product.added`, `product.pinned` | `productId`, operation status |
| `chat.send.requested` | `requestId`, `text` |
| `chat.sent` | `requestId`, optional `platformMessageId` |
| `chat.failed` | `requestId`, structured error |

`OperationStatus` is `success`, `error`, or `pending_verification`. An `error` status requires `{ code, message }`; other statuses cannot carry an error. These payloads describe normalized internal events, not TikTok request or response bodies.

## Use in a producer

```ts
import { createMockEvent, parseEvent } from "@live-hub/shared";

const fixture = createMockEvent("comment.received", {
  commentId: "comment-1",
  viewer: { id: "viewer-1", displayName: "Demo Viewer" },
  text: "Hello",
}, { accountId: "account-1", sessionId: "session-1" });

const event = parseEvent(fixture); // validate before publishing or persisting
```

## Use at an API boundary

```ts
import { validateEvent } from "@live-hub/shared";

const result = validateEvent(await request.json());
if (!result.success) {
  return Response.json({ errors: result.issues }, { status: 400 });
}
// result.data is a typed LiveEvent. Store or route it after authorization.
```

The validator rejects unknown fields in event envelopes and nested payloads, so a raw TikTok response or secret cannot be silently forwarded in this event contract. Keep authorization, account ownership, rate limits, deduplication, and durable delivery in the API/worker layers.

## Handoff decisions before production integration

- Oat: map `accountId`, `sessionId`, `eventId`, and the versioned payloads to the reviewed Prisma schema; define uniqueness and retention.
- C: confirm Stats/Product names, units, optional fields, and error states against verified platform responses. Until then, keep real endpoint status as `pending_verification`.
- Phum: confirm Comment/Chat fields and chat result semantics, including retry and failure codes.
- Nott: revise this contract only after those reviews, then map raw platform data inside the TikTok client and publish normalized events to the API/worker. No raw response or credential belongs in the shared package.
