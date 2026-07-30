import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVELOPMENT_API_BASE_URL,
  resolveApiRuntimeUrls,
} from '../src/core/config/runtimeUrls.js';

test('development fallback remains available only when explicitly enabled', () => {
  const urls = resolveApiRuntimeUrls('', { allowDevelopmentFallback: true });
  assert.equal(urls.apiBaseUrl, DEVELOPMENT_API_BASE_URL);
  assert.equal(urls.backendOrigin, 'http://localhost:5000');
  assert.equal(urls.socketOrigin, 'http://localhost:5000');
  assert.throws(() => resolveApiRuntimeUrls(''));
});

test('Railway-style API base and a trailing slash normalize safely', () => {
  const urls = resolveApiRuntimeUrls('https://backend.example.test/api/v1/');
  assert.equal(urls.apiBaseUrl, 'https://backend.example.test/api/v1');
  assert.equal(urls.backendOrigin, 'https://backend.example.test');
});

test('API base must have the exact terminal API suffix', () => {
  assert.throws(() => resolveApiRuntimeUrls('/api/v1'));
  assert.throws(() => resolveApiRuntimeUrls('https://backend.example.test/api/v10'));
  assert.throws(() => resolveApiRuntimeUrls('https://backend.example.test/api/v1/jobs'));
});

test('explicit Socket origin overrides the API origin', () => {
  const urls = resolveApiRuntimeUrls('https://backend.example.test/api/v1', {
    rawSocketUrl: 'https://socket.example.test/',
  });
  assert.equal(urls.socketOrigin, 'https://socket.example.test');
});

test('future custom domains need only environment changes', () => {
  const urls = resolveApiRuntimeUrls('https://api.example.test/api/v1');
  assert.deepEqual(urls, {
    apiBaseUrl: 'https://api.example.test/api/v1',
    backendOrigin: 'https://api.example.test',
    socketOrigin: 'https://api.example.test',
  });
});
