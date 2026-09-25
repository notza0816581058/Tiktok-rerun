import assert from "node:assert/strict";
import test from "node:test";
import {
  createMockTransport,
  createTikTokClient,
  mockAccountId,
  mockLiveSessionId,
} from "../src";

const live = { accountId: mockAccountId, liveSessionId: mockLiveSessionId };

test("mock modules return normalized fixtures marked pending verification", async () => {
  const client = createTikTokClient(createMockTransport());
  const auth = await client.auth.status({ accountId: mockAccountId });
  const stats = await client.stats.live(live);
  const products = await client.products.search({ accountId: mockAccountId, query: "demo" });
  const comments = await client.comments.list(live);

  for (const response of [auth, stats, products, comments]) {
    assert.equal(response.ok, true);
    assert.equal(response.source, "mock");
    assert.equal(response.verification.status, "pending_verification");
  }
  assert.equal(auth.ok && auth.data.connection, "not_connected");
  assert.equal(stats.ok && stats.data.enters, 315);
  assert.equal(stats.ok && stats.data.gmvPerHour, 1175);
  assert.equal(stats.ok && stats.data.impressionsPerHour, 900);
  assert.equal(products.ok && products.data.products.length, 3);
  assert.equal(comments.ok && comments.data.comments.length, 2);
});

test("product add, pin, and chat are explicitly simulated", async () => {
  const client = createTikTokClient(createMockTransport());
  const action = { ...live, productId: "demo-product-1" };

  const beforeAdd = await client.products.pin(action);
  assert.equal(beforeAdd.ok, false);
  assert.equal(!beforeAdd.ok && beforeAdd.error.code, "VALIDATION_ERROR");

  const add = await client.products.add(action);
  const pin = await client.products.pin(action);
  const chat = await client.chat.send({ ...live, requestId: "demo-request-1", text: "Hello" });

  assert.equal(add.ok && add.data.execution, "simulated");
  assert.equal(pin.ok && pin.data.execution, "simulated");
  assert.equal(chat.ok && chat.data.execution, "simulated");
  assert.equal(chat.verification.status, "pending_verification");
});

test("invalid mock identifiers and input return typed errors", async () => {
  const client = createTikTokClient(createMockTransport());
  const missingAccount = await client.stats.live({ accountId: "missing", liveSessionId: mockLiveSessionId });
  const missingLive = await client.comments.list({ accountId: mockAccountId, liveSessionId: "missing" });
  const missingProduct = await client.products.add({ ...live, productId: "missing" });
  const invalidSearch = await client.products.search({ accountId: mockAccountId, query: "", limit: 0 });
  const invalidChat = await client.chat.send({ ...live, requestId: "demo-request-2", text: " " });

  assert.equal(!missingAccount.ok && missingAccount.error.code, "ACCOUNT_NOT_FOUND");
  assert.equal(!missingLive.ok && missingLive.error.code, "LIVE_NOT_FOUND");
  assert.equal(!missingProduct.ok && missingProduct.error.code, "PRODUCT_NOT_FOUND");
  assert.equal(!invalidSearch.ok && invalidSearch.error.code, "VALIDATION_ERROR");
  assert.equal(!invalidChat.ok && invalidChat.error.code, "VALIDATION_ERROR");
  assert.equal(invalidChat.verification.status, "pending_verification");
});
