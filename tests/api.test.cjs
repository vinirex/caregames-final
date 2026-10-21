const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the real TypeScript API against in-memory storage and HTTP fixtures.
// No test contacts the production API or creates users/data.
function loadApi({ platform = 'android', dev = false, url, fixtures = [], stored = {} } = {}) {
  const storage = new Map(Object.entries(stored));
  const requests = [];
  const context = vm.createContext({
    __DEV__: dev,
    process: { env: { EXPO_PUBLIC_API_URL: url } },
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url, options) => {
      requests.push({ url, ...options });
      const fixture = fixtures.shift();
      assert.ok(fixture, `Unexpected request: ${url}`);
      return new Response(JSON.stringify(fixture.body), {
        status: fixture.status || 200,
        headers: { 'content-type': fixture.contentType || 'application/json' },
      });
    },
  });
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const requireMock = (name) => {
      if (name === 'react-native') return { Platform: { OS: platform } };
      if (name === '@react-native-async-storage/async-storage')
        return {
          __esModule: true,
          default: {
            multiGet: async (keys) => keys.map((key) => [key, storage.get(key) ?? null]),
            multiSet: async (entries) => entries.forEach(([key, value]) => storage.set(key, value)),
            multiRemove: async (keys) => keys.forEach((key) => storage.delete(key)),
            setItem: async (key, value) => storage.set(key, value),
          },
        };
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
      throw Error(`Unexpected import ${name}`);
    };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInContext(`(function(require, module, exports) {\n${code}\n})`, context)(
      requireMock,
      module,
      module.exports
    );
    cache.set(file, module.exports);
    return module.exports;
  }
  return { ...load(require.resolve('../services/api.ts')), storage, requests };
}

const validSession = () => ({
  '@user_api_key': 'test-token',
  '@user_token_issued_at': String(Date.now()),
});
const nullable = (value) => ({ String: value, Valid: true });

test('web development uses proxy even with the public API URL set', () => {
  const app = loadApi({ platform: 'web', dev: true, url: 'https://example.com/api/v1' });
  assert.equal(app.API_BASE_URL, 'http://localhost:8090/api/v1');
});

test('Android release uses HTTPS and never depends on the local proxy', () => {
  assert.equal(loadApi().API_BASE_URL, 'https://caregames.mk-ultra.tech/api/v1');
  assert.equal(
    loadApi({ url: 'https://example.com/api/v1/' }).API_BASE_URL,
    'https://example.com/api/v1'
  );
  assert.equal(loadApi({ dev: true }).API_BASE_URL, 'http://10.0.2.2:8080/api/v1');
});

test('ranking reads leaderboard, avatar and current user outside the returned page', async () => {
  const app = loadApi({
    fixtures: [
      {
        body: {
          success: true,
          data: {
            leaderboard: [
              {
                rank: 1,
                name: 'Ana',
                avatar_url: 'https://example.com/ana.jpg',
                initials: 'AN',
                points: 50,
              },
            ],
            current_user: { rank: 42 },
          },
        },
      },
    ],
  });
  const result = await app.api.getLeaderboard('me@example.com');
  assert.equal(result.leaderboard[0].avatar, 'https://example.com/ana.jpg');
  assert.equal(result.leaderboard[0].initials, 'AN');
  assert.equal(result.userRank, 42);
});

test('empty ranking keeps actual current user rank instead of inventing first place', async () => {
  const app = loadApi({
    fixtures: [{ body: { success: true, data: { leaderboard: [], current_user: { rank: 0 } } } }],
  });
  assert.equal((await app.api.getLeaderboard('me@example.com')).userRank, 0);
});

test('challenges read nested progress, target_value and nullable icon; preserve zero reward', async () => {
  const data = [
    {
      id: 'challenge-id',
      slug: 'steps_10k',
      target_value: 10000,
      points_reward: 0,
      icon_name: nullable('directions-walk'),
      progress: { current_value: 2500, status: 'in_progress' },
    },
  ];
  const app = loadApi({ fixtures: [{ body: { success: true, data } }] });
  const { challenges } = await app.api.getChallenges();
  assert.equal(challenges[0].progressPercent, 25);
  assert.equal(challenges[0].status, 'in_progress');
  assert.equal(challenges[0].points, 0);
  assert.equal(challenges[0].icon, 'directions-walk');
});

test('completed challenges include server ID and slug used by the daily card', async () => {
  const app = loadApi({
    fixtures: [
      {
        body: {
          success: true,
          data: [
            { id: 'uuid', slug: 'steps_10k', progress: { status: 'completed' } },
            { id: 'other', progress: null },
          ],
        },
      },
    ],
  });
  const result = await app.api.getCompletedChallenges('me@example.com');
  assert.equal(result.completedChallenges.join(','), 'uuid,steps_10k');
});

test('profile handles SQL nullable values, including invalid birthday and plain JSON', async () => {
  const app = loadApi({
    fixtures: [
      {
        body: {
          success: true,
          data: {
            name: nullable('Ana'),
            birthday: { Time: '1990-03-21T00:00:00Z', Valid: true },
            address: { String: '', Valid: false },
            photo_url: nullable('https://example.com/photo.jpg'),
          },
        },
      },
      {
        body: {
          success: true,
          data: { name: 'Ana', birthday: { Time: '0001-01-01T00:00:00Z', Valid: false } },
        },
      },
      { body: { success: true, data: { birthday: '2000-01-02T00:00:00Z' } } },
    ],
  });
  const first = await app.api.getProfile('me@example.com');
  assert.equal(first.profile.birthday, '1990-03-21');
  assert.equal(first.profile.name, 'Ana');
  assert.equal(first.profile.address, '');
  assert.equal(first.photoUri, 'https://example.com/photo.jpg');
  assert.equal((await app.api.getProfile('me@example.com')).profile.birthday, '');
  assert.equal((await app.api.getProfile('me@example.com')).profile.birthday, '2000-01-02');
});

test('benefits unwrap nullable stock/category/image and preserve zero prices', async () => {
  const app = loadApi({
    fixtures: [
      {
        body: {
          success: true,
          data: [
            {
              id: 'reward',
              points_cost: 0,
              category: nullable('saude'),
              image_url: nullable('https://example.com/reward.jpg'),
              stock: { Int64: 0, Valid: true },
            },
          ],
        },
      },
    ],
  });
  const { benefits } = await app.api.getBenefits();
  assert.equal(benefits[0].points, 0);
  assert.equal(benefits[0].stock, 0);
  assert.equal(benefits[0].category, 'saude');
  assert.equal(benefits[0].image, 'https://example.com/reward.jpg');
});

test('notifications unwrap list and unread_count', async () => {
  const app = loadApi({
    fixtures: [
      {
        body: {
          success: true,
          data: { notifications: [{ id: 'n1', is_read: false }], unread_count: 1 },
        },
      },
      { body: { success: true, data: { unread_count: 1 } } },
    ],
  });
  assert.equal((await app.api.getNotifications()).data[0].id, 'n1');
  assert.equal((await app.api.getUnreadNotificationCount()).data.count, 1);
});

test('login persists the issued token and sends it as Bearer on the next request', async () => {
  const app = loadApi({
    fixtures: [
      { body: { success: true, data: { api_key: 'issued-token' } } },
      { body: { success: true, data: { balance: 10 } } },
    ],
  });
  assert.equal((await app.api.login('me@example.com', 'test-password')).success, true);
  assert.equal((await app.api.getPoints('me@example.com')).points, 10);
  assert.equal(app.requests[1].headers.Authorization, 'Bearer issued-token');
});

test('expired or corrupt session clears token, emits logout and makes no HTTP request', async () => {
  for (const timestamp of [String(Date.now() - 120 * 60 * 1000), 'invalid']) {
    const app = loadApi({ stored: { ...validSession(), '@user_token_issued_at': timestamp } });
    let expired = 0;
    app.onSessionExpired(() => expired++);
    await assert.rejects(app.getValidToken(), { name: 'SessionExpiredError' });
    assert.equal(expired, 1);
    assert.equal(app.storage.has('@user_api_key'), false);
    assert.equal(app.requests.length, 0);
  }
});

test('HTTP 401 clears session and notifies logout even for non-JSON responses', async () => {
  const app = loadApi({
    stored: validSession(),
    fixtures: [{ status: 401, contentType: 'text/html', body: 'Unauthorized' }],
  });
  let expired = 0;
  const unsubscribe = app.onSessionExpired(() => expired++);
  await app.api.getPoints('me@example.com');
  assert.equal(expired, 1);
  assert.equal(app.storage.has('@user_api_key'), false);
  unsubscribe();
});
