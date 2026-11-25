/**
 * Phase 8 frontend auth integration checks against the live backend.
 * Validates API contract used by the React AuthContext/services.
 */
const API = process.env.API_BASE_URL || 'http://localhost:5000/api';
const marker = `phase8-ui-${Date.now()}`;

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

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status: response.status, data, headers: response.headers };
};

const run = async () => {
  console.log(`Running Phase 8 auth UI contract tests against ${API}\n`);

  const email = `${marker}@example.com`;
  const password = 'ValidPass123';

  // Registration works
  const register = await request('POST', '/auth/register', {
    body: { name: 'Phase8 User', email, password },
  });
  assert(
    register.status === 201 &&
      register.data?.data?.token &&
      register.data?.data?.user?.role === 'USER' &&
      !register.data?.data?.user?.password,
    '5. Registration works',
    JSON.stringify(register.data)
  );

  // Duplicate email
  const duplicate = await request('POST', '/auth/register', {
    body: { name: 'Dup', email, password },
  });
  assert(duplicate.status === 409, '6. Duplicate email displays an error', `status=${duplicate.status}`);

  // Valid login
  const login = await request('POST', '/auth/login', {
    body: { email, password },
  });
  const token = login.data?.data?.token;
  assert(
    login.status === 200 && token && login.data?.data?.user?.email === email,
    '3. Valid login works against backend',
    JSON.stringify(login.data)
  );

  // Invalid login
  const badLogin = await request('POST', '/auth/login', {
    body: { email, password: 'WrongPass123' },
  });
  assert(
    badLogin.status === 401 && badLogin.data?.message === 'Invalid email or password.',
    '4. Invalid login shows an appropriate error',
    JSON.stringify(badLogin.data)
  );

  // Bearer token on protected request
  const me = await request('GET', '/auth/me', { token });
  assert(
    me.status === 200 && me.data?.data?.user?.email === email,
    '13. API requests include Bearer token',
    JSON.stringify(me.data)
  );

  // Session restore equivalent
  const restore = await request('GET', '/auth/me', { token });
  assert(
    restore.status === 200 && restore.data?.data?.user?.id === login.data?.data?.user?.id,
    '7. Authentication state restores after page refresh (token + /me)',
    JSON.stringify(restore.data)
  );

  // Expired/invalid token handling
  const expired = await request('GET', '/auth/me', { token: 'invalid.token.value' });
  assert(expired.status === 401, '12. Expired/invalid token is handled', `status=${expired.status}`);

  // Cleanup
  // No delete-user API; leave test user. Marker email is unique per run.

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
