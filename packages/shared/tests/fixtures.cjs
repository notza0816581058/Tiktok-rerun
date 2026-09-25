const base = {
  schemaVersion: 1,
  eventId: "event-1",
  occurredAt: "2026-09-25T08:00:00.000Z",
  source: "mock",
  accountId: "account-1",
  sessionId: "session-1",
};

const viewer = { id: "viewer-1", displayName: "Demo Viewer" };

const payloads = {
  "comment.received": { commentId: "comment-1", viewer, text: "Hello" },
  "viewer.entered": { viewer },
  "reaction.liked": { viewer, count: 2 },
  "gift.received": { viewer, giftId: "gift-1", giftName: "Demo Gift", quantity: 1 },
  "stats.updated": {
    viewers: 50,
    enters: 200,
    likes: 100,
    comments: 5,
    gifts: 2,
    impressions: 300,
    gmv: 123.45,
    currency: "THB",
    gmvPerHour: 100.5,
    impressionsPerHour: 600,
  },
  "product.searched": {
    query: "demo",
    results: [{ productId: "product-1", title: "Demo Product" }],
    status: "success",
  },
  "product.added": { productId: "product-1", status: "pending_verification" },
  "product.pinned": { productId: "product-1", status: "success" },
  "chat.send.requested": { requestId: "request-1", text: "Hello everyone" },
  "chat.sent": { requestId: "request-1", platformMessageId: "message-1" },
  "chat.failed": {
    requestId: "request-1",
    error: { code: "MOCK_FAILURE", message: "Mock send failure" },
  },
};

function event(eventType, payload = payloads[eventType]) {
  return { ...base, eventType, payload };
}

module.exports = { base, event, payloads, viewer };
