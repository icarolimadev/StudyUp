import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttemptLimit } from '../security/attempt-limit.js';

test('limite separa IPs e libera tentativas após quinze minutos', () => {
  let time = 0;
  const middleware = createAttemptLimit({ limit: 5, now: () => time });
  function request(ip) {
    const result = { status: 200, headers: {} };
    const response = {
      set(key, value) { result.headers[key] = value; return this; },
      status(value) { result.status = value; return this; },
      json() { return this; },
    };
    middleware({ ip }, response, () => {});
    return result;
  }
  for (let i = 0; i < 5; i++) assert.equal(request('a').status, 200);
  assert.equal(request('a').status, 429);
  assert.equal(request('a').headers['Retry-After'], '900');
  assert.equal(request('b').status, 200);
  time = 900_000;
  assert.equal(request('a').status, 200);
});
