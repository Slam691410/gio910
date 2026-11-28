const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/kai-kyc-v47.js'), 'utf8');
const start = source.indexOf('  function ensureToolbarButtons()');
const end = source.indexOf('  function updateBadges()', start);
const nodes = new Map();
let role = 'Karyawan';
let signedIn = true;
function element() {
  return { style: {}, addEventListener() {}, appendChild(child) { nodes.set(child.id, child); }, remove() { nodes.delete(this.id); } };
}
const actions = element();
nodes.set('blog-admin-actions', actions);
let toolbar = null;
const context = {
  document: { querySelector: () => toolbar, getElementById: id => nodes.get(id), createElement: element },
  getSession: () => signedIn ? { token: 'test-only' } : null,
  isReviewerRole: () => ['Pemilik', 'Manajemen'].includes(role),
  openKycEnrollmentModal() {}, openKycReviewModal() {}, updateBadges() {}, cachedPendingCount: 0
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
context.ensureToolbarButtons();
assert(nodes.has('blog-kyc-btn'), 'Copy Hub works without portal toolbar');
assert(!nodes.has('blog-kyc-review-btn'), 'Employee has no review button');
role = 'Pemilik';
context.ensureToolbarButtons();
assert(nodes.has('blog-kyc-review-btn'), 'Role upgrade adds reviewer button independently');
role = 'Karyawan';
context.ensureToolbarButtons();
assert(!nodes.has('blog-kyc-review-btn'), 'Role downgrade removes reviewer button');
signedIn = false;
context.ensureToolbarButtons();
assert(!nodes.has('blog-kyc-btn'), 'Logout removes Copy Hub enrollment button');
signedIn = true;
role = 'Manajemen';
toolbar = element();
context.ensureToolbarButtons();
assert(nodes.has('kai-btn-kyc') && nodes.has('kai-btn-kyc-review'), 'Portal mounts both buttons for management');
role = 'Karyawan';
context.ensureToolbarButtons();
assert(!nodes.has('kai-btn-kyc-review'), 'Portal removes stale reviewer button');
assert(!source.includes('livenessScore: Math.max(1.5, obsLive)'), 'No fabricated liveness fallback');
console.log('PASS: 8 KYC toolbar/liveness regression assertions (local unit tests; not authenticated E2E)');
