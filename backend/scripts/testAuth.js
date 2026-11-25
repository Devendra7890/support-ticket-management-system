/**
 * Phase 3 automated authentication & authorization integration tests.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import { USER_ROLES } from '../src/constants/roles.js';
import { hashPassword } from '../src/utils/password.js';
import { signTokenWithExpiry } from '../src/utils/jwt.js';

const BASE_URL = `http://localhost:${env.port}/api`;
const marker = `phase3-${Date.now()}`;
const createdUserIds = [];

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed += 1;
  console.log(`PASS  ${name}`);
};

const logFail = (name, detail) => {
  failed += 1;
  console.error(`FAIL  ${name} — ${detail}`);
};

const request = async (method, path, { body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
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

  return { status: response.status, data };
};

const trackUserByEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('_id');
  if (user) {
    createdUserIds.push(user._id);
  }
};

const assert = (condition, name, detail = 'assertion failed') => {
  if (condition) {
    logPass(name);
  } else {
    logFail(name, detail);
  }
};

const run = async () => {
  console.log(`Running Phase 3 auth tests against ${BASE_URL}\n`);
  await mongoose.connect(env.mongodbUri);

  const userEmail = `${marker}-user@example.com`;
  const userPassword = 'ValidPass123';
  let userToken = null;
  let adminToken = null;

  // 1. Successful registration
  {
    const res = await request('POST', '/auth/register', {
      body: { name: 'Phase3 User', email: userEmail, password: userPassword },
    });
    await trackUserByEmail(userEmail);
    assert(
      res.status === 201 &&
        res.data?.success === true &&
        res.data?.data?.token &&
        res.data?.data?.user?.role === USER_ROLES.USER &&
        res.data?.data?.user?.password === undefined,
      '1. Successful registration',
      JSON.stringify(res.data)
    );
    userToken = res.data?.data?.token;
  }

  // 2. Duplicate email registration
  {
    const res = await request('POST', '/auth/register', {
      body: { name: 'Duplicate', email: userEmail, password: userPassword },
    });
    assert(res.status === 409, '2. Duplicate email registration', `status=${res.status}`);
  }

  // 3. Invalid email
  {
    const res = await request('POST', '/auth/register', {
      body: {
        name: 'Bad Email',
        email: 'not-an-email',
        password: userPassword,
      },
    });
    assert(res.status === 400, '3. Invalid email', `status=${res.status}`);
  }

  // 4. Weak / invalid password
  {
    const res = await request('POST', '/auth/register', {
      body: {
        name: 'Weak Password',
        email: `${marker}-weak@example.com`,
        password: 'short',
      },
    });
    assert(res.status === 400, '4. Weak or invalid password', `status=${res.status}`);
  }

  // 5. Successful login
  {
    const res = await request('POST', '/auth/login', {
      body: { email: userEmail, password: userPassword },
    });
    assert(
      res.status === 200 && res.data?.data?.token && !res.data?.data?.user?.password,
      '5. Successful login',
      JSON.stringify(res.data)
    );
    userToken = res.data?.data?.token || userToken;
  }

  // 6. Incorrect password
  {
    const res = await request('POST', '/auth/login', {
      body: { email: userEmail, password: 'WrongPass123' },
    });
    assert(
      res.status === 401 && res.data?.message === 'Invalid email or password.',
      '6. Incorrect password',
      JSON.stringify(res.data)
    );
  }

  // 7. Non-existent email
  {
    const res = await request('POST', '/auth/login', {
      body: { email: `${marker}-missing@example.com`, password: userPassword },
    });
    assert(
      res.status === 401 && res.data?.message === 'Invalid email or password.',
      '7. Non-existent email',
      JSON.stringify(res.data)
    );
  }

  // 8. /me without token
  {
    const res = await request('GET', '/auth/me');
    assert(res.status === 401, '8. Access /me without token', `status=${res.status}`);
  }

  // 9. /me with valid token
  {
    const res = await request('GET', '/auth/me', { token: userToken });
    assert(
      res.status === 200 &&
        res.data?.data?.user?.email === userEmail &&
        res.data?.data?.user?.password === undefined,
      '9. Access /me with valid token',
      JSON.stringify(res.data)
    );
  }

  // 10. /me with expired token
  {
    const user = await User.findOne({ email: userEmail });
    const expiredToken = signTokenWithExpiry(user._id, '1ms');
    await new Promise((resolve) => setTimeout(resolve, 20));
    const res = await request('GET', '/auth/me', { token: expiredToken });
    assert(res.status === 401, '10. Access /me with expired token', `status=${res.status}`);
  }

  // Prepare ADMIN for role tests (direct DB insert — not public registration)
  const adminEmail = `${marker}-admin@example.com`;
  const adminPassword = 'AdminPass123';
  const adminUser = await User.create({
    name: 'Phase3 Admin',
    email: adminEmail,
    password: await hashPassword(adminPassword),
    role: USER_ROLES.ADMIN,
  });
  createdUserIds.push(adminUser._id);

  {
    const res = await request('POST', '/auth/login', {
      body: { email: adminEmail, password: adminPassword },
    });
    adminToken = res.data?.data?.token;
    assert(Boolean(adminToken), 'Admin login for role tests', JSON.stringify(res.data));
  }

  // 11. Protected admin route as USER
  {
    const res = await request('GET', '/admin/check', { token: userToken });
    assert(res.status === 403, '11. Access protected admin route as USER', `status=${res.status}`);
  }

  // 12. Protected admin route as ADMIN
  {
    const res = await request('GET', '/admin/check', { token: adminToken });
    assert(
      res.status === 200 && res.data?.success === true,
      '12. Access protected admin route as ADMIN',
      JSON.stringify(res.data)
    );
  }

  // 13. Public registration attempting to set role ADMIN
  {
    const escalateEmail = `${marker}-escalate@example.com`;
    const res = await request('POST', '/auth/register', {
      body: {
        name: 'Escalator',
        email: escalateEmail,
        password: userPassword,
        role: USER_ROLES.ADMIN,
      },
    });
    await trackUserByEmail(escalateEmail);
    assert(
      res.status === 400 ||
        (res.status === 201 && res.data?.data?.user?.role === USER_ROLES.USER),
      '13. Public registration attempting to set role ADMIN',
      `status=${res.status}, role=${res.data?.data?.user?.role}, message=${res.data?.message}`
    );

    if (res.status === 201) {
      const dbUser = await User.findOne({ email: escalateEmail });
      assert(
        dbUser?.role === USER_ROLES.USER,
        '13b. DB role remains USER after escalation attempt',
        `role=${dbUser?.role}`
      );
    }
  }

  // 14. Deleted user attempting to use an old token
  {
    const doomedEmail = `${marker}-doomed@example.com`;
    const registerRes = await request('POST', '/auth/register', {
      body: {
        name: 'Doomed User',
        email: doomedEmail,
        password: userPassword,
      },
    });
    const doomedToken = registerRes.data?.data?.token;
    const doomedUser = await User.findOne({ email: doomedEmail });
    if (doomedUser) {
      createdUserIds.push(doomedUser._id);
      await User.deleteOne({ _id: doomedUser._id });
    }

    const res = await request('GET', '/auth/me', { token: doomedToken });
    assert(
      res.status === 401,
      '14. Deleted user attempting to use an old token',
      `status=${res.status}, message=${res.data?.message}`
    );
  }

  // Health check still works
  {
    const res = await request('GET', '/health');
    assert(
      res.status === 200 && res.data?.success === true,
      'Health endpoint still works',
      JSON.stringify(res.data)
    );
  }

  console.log('\nCleaning up temporary test users...');
  if (createdUserIds.length > 0) {
    await User.deleteMany({ _id: { $in: createdUserIds } });
  }
  // Also clean any leftover by marker email pattern
  await User.deleteMany({ email: new RegExp(`^${marker}`) });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
};

run()
  .catch((error) => {
    console.error('Auth test runner failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
