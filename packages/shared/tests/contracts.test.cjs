const assert = require("node:assert/strict");
const test = require("node:test");
const { ContractValidationError, isLiveEvent, parseEvent, validateEvent } = require("../dist/index.js");
const { event, payloads } = require("./fixtures.cjs");

test("all proposed event families accept normalized mock fixtures", () => {
  for (const type of Object.keys(payloads)) {
    const fixture = event(type);
    const result = validateEvent(fixture);
    assert.equal(result.success, true, `${type}: ${JSON.stringify(result.issues)}`);
    assert.equal(parseEvent(fixture).eventType, type);
    assert.equal(isLiveEvent(fixture), true);
  }
});

test("rejects unverified schema versions and missing session context", () => {
  const wrongVersion = validateEvent({ ...event("comment.received"), schemaVersion: 2 });
  assert.equal(wrongVersion.success, false);
  assert.ok(wrongVersion.issues.some((issue) => issue.path === "event.schemaVersion"));

  const { sessionId, ...withoutSession } = event("comment.received");
  const missingSession = validateEvent(withoutSession);
  assert.equal(missingSession.success, false);
  assert.ok(missingSession.issues.some((issue) => issue.path === "event.sessionId"));
  assert.equal(isLiveEvent(withoutSession), false);
});

test("search can be associated with an account before a live session exists", () => {
  const { sessionId, ...withoutSession } = event("product.searched");
  assert.equal(validateEvent(withoutSession).success, true);
});

test("stats can omit gifts until the source metric is verified", () => {
  const { gifts, ...knownStats } = payloads["stats.updated"];
  assert.equal(validateEvent(event("stats.updated", knownStats)).success, true);
});

test("rejects raw platform fields and secret-bearing extensions", () => {
  const rawPayload = {
    ...event("comment.received"),
    cookie: "do-not-copy",
    payload: { ...payloads["comment.received"], rawTikTokResponse: {} },
  };
  const result = validateEvent(rawPayload);
  assert.equal(result.success, false);
  assert.ok(result.issues.some((issue) => issue.path === "event.cookie"));
  assert.ok(result.issues.some((issue) => issue.path === "payload.rawTikTokResponse"));
});

test("product failures require a structured error and success cannot include one", () => {
  const failure = validateEvent(event("product.pinned", { productId: "p1", status: "error" }));
  assert.equal(failure.success, false);
  assert.ok(failure.issues.some((issue) => issue.path === "payload.error"));

  const successWithError = validateEvent(event("product.added", {
    productId: "p1",
    status: "success",
    error: { code: "BAD", message: "No" },
  }));
  assert.equal(successWithError.success, false);
  assert.ok(successWithError.issues.some((issue) => issue.path === "payload.error"));
});

test("rejects malformed timestamps, negative metrics, and missing chat fields", () => {
  assert.equal(validateEvent({ ...event("viewer.entered"), occurredAt: "yesterday" }).success, false);
  assert.equal(validateEvent(event("stats.updated", {
    ...payloads["stats.updated"],
    gmvPerHour: -1,
  })).success, false);
  assert.equal(validateEvent(event("chat.send.requested", { requestId: "request-1" })).success, false);
});

test("parseEvent reports validation paths in a typed error", () => {
  assert.throws(
    () => parseEvent(event("chat.failed", { requestId: "request-1", error: null })),
    (error) => error instanceof ContractValidationError && error.issues.some((issue) => issue.path === "payload.error"),
  );
});
