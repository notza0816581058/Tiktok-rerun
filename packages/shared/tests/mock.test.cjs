const assert = require('node:assert/strict');
const test = require('node:test');
const { createMockEvent, validateEvent } = require('../dist/index.js');

test('mock event factory creates a validated comment event', () => {
  const output = createMockEvent(
    'comment.received',
    {
      accountId: 'account-1',
      commentId: 'comment-1',
      user: { id: 'viewer-1', displayName: 'Demo Viewer' },
      text: 'สวัสดี',
      type: 'comment',
    },
    {
      eventId: 'mock-1',
      occurredAt: '2026-09-25T08:00:00.000Z',
      accountId: 'account-1',
      sessionId: 'session-1',
    },
  );
  assert.equal(output.source, 'mock');
  assert.equal(output.eventId, 'mock-1');
  assert.equal(validateEvent(output).success, true);
});

test('mock event factory refuses a payload that violates the contract', () => {
  assert.throws(() =>
    createMockEvent('reaction.liked', {
      viewer: { id: 'viewer-1', displayName: 'Demo Viewer' },
      count: -10,
    }),
  );
});
