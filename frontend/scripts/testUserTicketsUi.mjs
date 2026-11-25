/**
 * Phase 9 user ticket UI contract tests against live backend APIs.
 */
const API = process.env.API_BASE_URL || 'http://localhost:5000/api';
const marker = `phase9-ui-${Date.now()}`;

let passed = 0;
let failed = 0;

const assert = (condition, name, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

const request = async (method, path, { body, token, query } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${API}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
};

const run = async () => {
  console.log(`Running Phase 9 user ticket UI contract tests against ${API}\n`);

  const email = `${marker}@example.com`;
  const password = 'ValidPass123';

  const register = await request('POST', '/auth/register', {
    body: { name: 'Phase9 UI User', email, password },
  });
  const token = register.data?.data?.token;
  assert(register.status === 201 && token, 'User auth for dashboard');

  // Dashboard stats sources
  const [total, open, progress, resolved, recent, notes] = await Promise.all([
    request('GET', '/tickets', { token, query: { page: 1, limit: 1 } }),
    request('GET', '/tickets', { token, query: { page: 1, limit: 1, status: 'OPEN' } }),
    request('GET', '/tickets', { token, query: { page: 1, limit: 1, status: 'IN_PROGRESS' } }),
    request('GET', '/tickets', { token, query: { page: 1, limit: 1, status: 'RESOLVED' } }),
    request('GET', '/tickets', {
      token,
      query: { page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' },
    }),
    request('GET', '/notifications', { token, query: { page: 1, limit: 5 } }),
  ]);

  assert(
    [total, open, progress, resolved, recent, notes].every((r) => r.status === 200),
    'Dashboard data endpoints succeed'
  );

  const created = await request('POST', '/tickets', {
    token,
    body: {
      title: 'Phase9 UI create ticket',
      description: 'Created from Phase 9 frontend contract verification script.',
      category: 'Technical',
      priority: 'HIGH',
    },
  });
  const ticketId = created.data?.data?.ticket?._id;
  assert(created.status === 201 && ticketId, 'Create ticket API for UI form');

  const list = await request('GET', '/tickets', {
    token,
    query: { search: 'Phase9 UI', status: 'OPEN', priority: 'HIGH', page: 1, limit: 10 },
  });
  assert(
    list.status === 200 &&
      (list.data?.data?.tickets || []).some((t) => t._id === ticketId),
    'Tickets list filtering/search for UI'
  );

  const detail = await request('GET', `/tickets/${ticketId}`, { token });
  assert(detail.status === 200, 'Ticket details API');

  const updated = await request('PATCH', `/tickets/${ticketId}`, {
    token,
    body: { title: 'Phase9 UI create ticket updated' },
  });
  assert(updated.status === 200, 'Edit ticket API for UI');

  const comment = await request('POST', `/tickets/${ticketId}/comments`, {
    token,
    body: { message: 'Phase9 UI comment' },
  });
  assert(comment.status === 201, 'Add comment API for UI');

  const comments = await request('GET', `/tickets/${ticketId}/comments`, {
    token,
    query: { page: 1, limit: 20 },
  });
  assert((comments.data?.data?.comments || []).length >= 1, 'Comments list for UI');

  const activity = await request('GET', `/tickets/${ticketId}/activity`, {
    token,
    query: { page: 1, limit: 50 },
  });
  assert((activity.data?.data?.activities || []).length >= 1, 'Activity timeline for UI');

  const deleted = await request('DELETE', `/tickets/${ticketId}`, { token });
  assert(deleted.status === 200, 'Delete ticket API for UI confirmation flow');

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
