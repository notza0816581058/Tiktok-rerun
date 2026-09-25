import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nextRetryDelayMs,
  parseProxyConfig,
  parseSanitizedCurl,
  redactRequestForLog,
  substituteRequestTemplate,
} from '../src';

test('cURL sample becomes a pending template without copied identifiers or credentials', () => {
  const sample = `curl 'https://example.invalid/live/<ROOM_ID>?room_id=old-room&creator_id=old-creator&access_token=old-token&lang=th' \
    -X POST -H 'Content-Type: application/json' -H 'Cookie: sid=old-secret' \
    -H 'Authorization: Bearer old-token' -H 'X-Unknown: old-secret' \
    --data-raw '{"room_id":"old-room","account_id":"old-account","csrf_token":"old-secret","nested":{"creator_id":"old-creator","note":"sample"}}'`;
  const template = parseSanitizedCurl(sample);

  assert.equal(template.method, 'POST');
  assert.equal(template.pathname, '/live/<ROOM_ID>');
  assert.equal(template.verification.status, 'pending_verification');
  assert.equal(template.headers.cookie, '<COOKIE>');
  assert.equal(template.headers.authorization, '<ACCESS_TOKEN>');
  assert.equal(template.headers['x-unknown'], '<REDACTED>');
  assert.equal(template.bodyFormat, 'json');
  const stored = JSON.stringify(template);
  for (const copiedValue of ['old-room', 'old-creator', 'old-account', 'old-token', 'old-secret']) {
    assert.equal(stored.includes(copiedValue), false);
  }
});

test('substitution handles URL encoding and JSON escaping, then log redaction hides all values', () => {
  const template = parseSanitizedCurl(
    `curl 'https://example.invalid/live/<ROOM_ID>?account_id=placeholder&creator_id=placeholder' ` +
      `-H 'Cookie: <COOKIE>' -H 'Content-Type: application/json' ` +
      `--data-raw '{"account_id":"<ACCOUNT_ID>","room_id":"<ROOM_ID>","text":"demo"}'`,
  );
  const request = substituteRequestTemplate(template, {
    roomId: 'room/with space',
    accountId: 'account"1',
    creatorId: 'creator&2',
    cookie: 'sid=secret-cookie',
  });
  const url = new URL(request.url);
  assert.equal(url.pathname, '/live/room%2Fwith%20space');
  assert.equal(url.searchParams.get('account_id'), 'account"1');
  assert.equal(url.searchParams.get('creator_id'), 'creator&2');
  assert.equal(request.headers.cookie, 'sid=secret-cookie');
  assert.deepEqual(JSON.parse(request.body ?? ''), {
    account_id: 'account"1',
    room_id: 'room/with space',
    text: 'demo',
  });
  assert.equal(request.verification.status, 'pending_verification');

  const safeLog = JSON.stringify(redactRequestForLog(request));
  for (const privateValue of [
    'secret-cookie',
    'account"1',
    'room/with space',
    'creator&2',
    'demo',
  ]) {
    assert.equal(safeLog.includes(privateValue), false);
  }
  assert.throws(
    () =>
      substituteRequestTemplate(template, {
        roomId: 'r',
        accountId: 'a',
        creatorId: 'c',
      }),
    /COOKIE/,
  );
  assert.throws(
    () =>
      substituteRequestTemplate(template, {
        roomId: 'r',
        accountId: 'a',
        creatorId: 'c',
        cookie: 'bad\r\nheader',
      }),
    /COOKIE/,
  );
});

test('form data is normalized and unsupported or ambiguous cURL input is rejected', () => {
  const template = parseSanitizedCurl(
    `curl --url 'https://example.invalid/api?account_id=old' ` +
      `-H 'Content-Type: application/x-www-form-urlencoded' --cookie 'sid=old' ` +
      `--data-raw 'room_id=old&creator_id=old&csrf_token=old&mode=demo'`,
  );
  assert.equal(template.bodyFormat, 'form');
  assert.equal(template.body?.includes('old'), false);
  const prepared = substituteRequestTemplate(template, {
    accountId: 'account-1',
    roomId: 'room-1',
    creatorId: 'creator-1',
    cookie: 'sid=test',
  });
  const form = new URLSearchParams(prepared.body);
  assert.equal(form.get('room_id'), 'room-1');
  assert.equal(form.get('creator_id'), 'creator-1');
  assert.equal(form.get('csrf_token'), '<REDACTED>');
  assert.equal(form.get('mode'), 'demo');
  assert.throws(
    () => parseSanitizedCurl(`curl 'https://example.invalid' --insecure`),
    /Unsupported/,
  );
  assert.throws(
    () => parseSanitizedCurl(`curl 'https://user:password@example.invalid'`),
    /credentials/,
  );
  assert.throws(
    () => parseSanitizedCurl(`curl 'https://example.invalid' -H 'Cookie: a' -b 'b'`),
    /Cookie/,
  );
  assert.throws(
    () => parseSanitizedCurl(`curl 'https://example.invalid' --data-raw 'free text'`),
    /Only JSON/,
  );
  assert.throws(() => parseSanitizedCurl(`curl 'https://example.invalid`), /Unclosed/);
});

test('proxy config validates HTTP and SOCKS5 settings without embedded credentials', () => {
  assert.deepEqual(parseProxyConfig('http://proxy.example:8080'), {
    scheme: 'http',
    host: 'proxy.example',
    port: 8080,
  });
  assert.deepEqual(parseProxyConfig('socks5://127.0.0.1:1080'), {
    scheme: 'socks5',
    host: '127.0.0.1',
    port: 1080,
  });
  assert.deepEqual(parseProxyConfig('socks5h://proxy.example'), {
    scheme: 'socks5h',
    host: 'proxy.example',
    port: 1080,
  });
  for (const invalid of [
    'http://user:password@proxy.example:8080',
    'http://proxy.example:0',
    'http://proxy.example/path',
    'ftp://proxy.example:21',
  ]) {
    assert.throws(() => parseProxyConfig(invalid));
  }
});

test('retry planner caps exponential backoff and refuses unsafe or exhausted retries', () => {
  const policy = { maxAttempts: 4, baseDelayMs: 100, maxDelayMs: 250, jitterRatio: 0.2 };
  const decision = { retryable: true, idempotent: true };
  assert.equal(nextRetryDelayMs(policy, { ...decision, completedAttempts: 1 }), 100);
  assert.equal(nextRetryDelayMs(policy, { ...decision, completedAttempts: 2 }), 200);
  assert.equal(nextRetryDelayMs(policy, { ...decision, completedAttempts: 3 }), 250);
  assert.equal(nextRetryDelayMs(policy, { ...decision, completedAttempts: 1, random: 0 }), 80);
  assert.equal(nextRetryDelayMs(policy, { ...decision, completedAttempts: 4 }), null);
  assert.equal(
    nextRetryDelayMs(policy, { ...decision, completedAttempts: 1, idempotent: false }),
    null,
  );
  assert.equal(
    nextRetryDelayMs(policy, { ...decision, completedAttempts: 1, retryable: false }),
    null,
  );
  assert.throws(
    () =>
      nextRetryDelayMs(
        { ...policy, maxAttempts: 0 },
        {
          ...decision,
          completedAttempts: 1,
        },
      ),
    /Invalid/,
  );
});
