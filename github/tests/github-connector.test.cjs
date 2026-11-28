const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/github');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
async function request(method = 'GET') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(data) { this.body = data; return this; } };
  await handler({ method }, res);
  return res;
}
test('returns verified public repository status without credentials', async () => {
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.github.com/repos/Slam691410/gio910');
    assert.equal(options.headers.Authorization, undefined);
    return { ok: true, json: async () => ({ full_name: 'Slam691410/gio910', default_branch: 'main', private: false }) };
  };
  const r = await request();
  assert.equal(r.code, 200); assert.equal(r.body.defaultBranch, 'main');
  assert.equal(r.body.mode, 'public-read-only'); assert.equal(r.headers['Cache-Control'], 'no-store');
});
test('reports upstream errors and mismatched repository without claiming connectivity', async () => {
  global.fetch = async () => ({ ok: false, status: 403 });
  let r = await request(); assert.equal(r.code, 502); assert.equal(r.body.upstreamStatus, 403);
  global.fetch = async () => ({ ok: true, json: async () => ({ full_name: 'wrong/repo', private: false }) });
  r = await request(); assert.equal(r.code, 502);
  global.fetch = async () => { throw new Error('timeout'); };
  r = await request(); assert.equal(r.code, 502);
});
test('rejects writes', async () => {
  global.fetch = async () => { throw new Error('must not call GitHub'); };
  const r = await request('POST'); assert.equal(r.code, 405); assert.equal(r.headers.Allow, 'GET');
});
