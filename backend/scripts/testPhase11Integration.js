/**
 * Phase 11 — search/filter/sort/pagination/stats integration checks.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import Ticket from '../src/models/Ticket.js';
import { USER_ROLES } from '../src/constants/roles.js';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../src/constants/ticket.js';
import { hashPassword } from '../src/utils/password.js';
import { buildStableSort, buildPaginationMeta } from '../src/utils/pagination.js';

const BASE_URL = `http://localhost:${env.port}/api`;
const marker = `phase11-${Date.now()}`;

const createdUserIds = [];
const createdTicketIds = [];

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

const assert = (condition, name, detail = 'assertion failed') => {
  if (condition) logPass(name);
  else logFail(name, detail);
};

const request = async (method, path, { body, token, query } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.set(key, String(value));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
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

const cleanup = async () => {
  if (createdTicketIds.length) {
    await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  }
  if (createdUserIds.length) {
    await User.deleteMany({ _id: { $in: createdUserIds } });
  }
};

const main = async () => {
  await mongoose.connect(env.mongodbUri);

  assert(
    JSON.stringify(buildStableSort('createdAt', 'desc')) ===
      JSON.stringify({ createdAt: -1, _id: -1 }),
    'Stable sort includes _id tie-breaker'
  );
  assert(
    buildPaginationMeta({ total: 25, page: 2, limit: 10 }).totalPages === 3,
    'Pagination metadata totalPages calculation'
  );

  const password = 'UserSecurePass123!';
  const userRes = await request('POST', '/auth/register', {
    body: {
      name: 'Phase11 User',
      email: `${marker}-user@example.com`,
      password,
    },
  });
  const userToken = userRes.data?.data?.token;
  const userId = userRes.data?.data?.user?.id || userRes.data?.data?.user?._id;
  if (userId) createdUserIds.push(userId);
  assert(userRes.status === 201 && userToken, 'Register user');

  const admin = await User.create({
    name: 'Phase11 Admin',
    email: `${marker}-admin@example.com`,
    password: await hashPassword('AdminSecurePass123!'),
    role: USER_ROLES.ADMIN,
  });
  createdUserIds.push(admin._id);
  const adminLogin = await request('POST', '/auth/login', {
    body: { email: admin.email, password: 'AdminSecurePass123!' },
  });
  const adminToken = adminLogin.data?.data?.token;
  assert(adminLogin.status === 200 && adminToken, 'Admin login');

  const specs = [
    {
      title: `${marker} alpha network`,
      description: 'Alpha description about network connectivity issues.',
      category: 'Technical',
      priority: TICKET_PRIORITIES.HIGH,
    },
    {
      title: `${marker} beta billing`,
      description: 'Beta description about invoice charges.',
      category: 'Billing',
      priority: TICKET_PRIORITIES.URGENT,
    },
    {
      title: `${marker} gamma account`,
      description: 'Gamma description about account recovery.',
      category: 'Account',
      priority: TICKET_PRIORITIES.LOW,
    },
    {
      title: `${marker} delta general`,
      description: 'Delta description for general support help.',
      category: 'General',
      priority: TICKET_PRIORITIES.MEDIUM,
    },
    {
      title: `${marker} epsilon other`,
      description: 'Epsilon description for other category issue.',
      category: 'Other',
      priority: TICKET_PRIORITIES.MEDIUM,
    },
  ];

  for (const spec of specs) {
    const res = await request('POST', '/tickets', { token: userToken, body: spec });
    const id = res.data?.data?.ticket?._id;
    if (id) createdTicketIds.push(id);
  }
  assert(createdTicketIds.length === 5, 'Seed five tickets for list tests');

  // Move one ticket to IN_PROGRESS via admin for stats accuracy
  const progressRes = await request(
    'PATCH',
    `/admin/tickets/${createdTicketIds[0]}/status`,
    {
      token: adminToken,
      body: { status: TICKET_STATUSES.IN_PROGRESS },
    }
  );
  assert(progressRes.status === 200, 'Prepare IN_PROGRESS ticket for stats');

  // User search
  const userSearch = await request('GET', '/tickets', {
    token: userToken,
    query: { search: 'billing', page: 1, limit: 10 },
  });
  assert(
    userSearch.status === 200 &&
      userSearch.data?.data?.tickets?.some((t) =>
        String(t.title).includes('beta billing')
      ),
    'User ticket search'
  );

  // User status / priority filters
  const userStatus = await request('GET', '/tickets', {
    token: userToken,
    query: { status: TICKET_STATUSES.IN_PROGRESS },
  });
  assert(
    userStatus.status === 200 &&
      userStatus.data?.data?.tickets?.every(
        (t) => t.status === TICKET_STATUSES.IN_PROGRESS
      ),
    'User status filtering'
  );

  const userPriority = await request('GET', '/tickets', {
    token: userToken,
    query: { priority: TICKET_PRIORITIES.URGENT },
  });
  assert(
    userPriority.status === 200 &&
      userPriority.data?.data?.tickets?.every(
        (t) => t.priority === TICKET_PRIORITIES.URGENT
      ),
    'User priority filtering'
  );

  // User pagination + sorting
  const page1 = await request('GET', '/tickets', {
    token: userToken,
    query: { page: 1, limit: 2, sortBy: 'createdAt', sortOrder: 'asc' },
  });
  const page2 = await request('GET', '/tickets', {
    token: userToken,
    query: { page: 2, limit: 2, sortBy: 'createdAt', sortOrder: 'asc' },
  });
  assert(
    page1.status === 200 &&
      page1.data?.data?.pagination?.limit === 2 &&
      page1.data?.data?.tickets?.length === 2 &&
      page1.data?.data?.pagination?.hasNextPage === true,
    'User pagination page 1'
  );
  assert(
    page2.status === 200 &&
      page2.data?.data?.tickets?.[0]?._id !== page1.data?.data?.tickets?.[0]?._id,
    'User pagination page 2 returns different records'
  );

  const sortUpdated = await request('GET', '/tickets', {
    token: userToken,
    query: { sortBy: 'updatedAt', sortOrder: 'desc', limit: 5 },
  });
  assert(sortUpdated.status === 200, 'User sorting by updatedAt');

  // Combined filters
  const combined = await request('GET', '/tickets', {
    token: userToken,
    query: {
      search: marker,
      status: TICKET_STATUSES.OPEN,
      priority: TICKET_PRIORITIES.MEDIUM,
      page: 1,
      limit: 10,
    },
  });
  assert(
    combined.status === 200 &&
      combined.data?.data?.tickets?.every(
        (t) =>
          t.status === TICKET_STATUSES.OPEN &&
          t.priority === TICKET_PRIORITIES.MEDIUM
      ),
    'User combined filters'
  );

  // Admin filters
  const adminSearch = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: { search: 'network', page: 1, limit: 10 },
  });
  assert(
    adminSearch.status === 200 &&
      adminSearch.data?.data?.tickets?.some((t) =>
        String(t.title).includes('alpha network')
      ),
    'Admin global search'
  );

  const adminStatus = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: { status: TICKET_STATUSES.IN_PROGRESS, search: marker },
  });
  assert(
    adminStatus.status === 200 &&
      adminStatus.data?.data?.tickets?.every(
        (t) => t.status === TICKET_STATUSES.IN_PROGRESS
      ),
    'Admin status filtering'
  );

  const adminPriority = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: { priority: TICKET_PRIORITIES.HIGH, search: marker },
  });
  assert(
    adminPriority.status === 200 &&
      adminPriority.data?.data?.tickets?.every(
        (t) => t.priority === TICKET_PRIORITIES.HIGH
      ),
    'Admin priority filtering'
  );

  const adminCategory = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: { category: 'Billing', search: marker },
  });
  assert(
    adminCategory.status === 200 &&
      adminCategory.data?.data?.tickets?.every((t) => t.category === 'Billing'),
    'Admin category filtering'
  );

  const adminCreator = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: { createdBy: userId, search: marker },
  });
  assert(
    adminCreator.status === 200 &&
      adminCreator.data?.data?.pagination?.total === 5,
    'Admin creator filtering'
  );

  const adminPage = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: {
      search: marker,
      page: 1,
      limit: 2,
      sortBy: 'priority',
      sortOrder: 'asc',
    },
  });
  assert(
    adminPage.status === 200 &&
      adminPage.data?.data?.pagination?.hasNextPage === true &&
      adminPage.data?.data?.tickets?.length === 2,
    'Admin pagination + sorting'
  );

  const adminCombinedPage = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: {
      search: marker,
      status: TICKET_STATUSES.OPEN,
      priority: TICKET_PRIORITIES.MEDIUM,
      category: 'General',
      createdBy: userId,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  });
  assert(
    adminCombinedPage.status === 200 &&
      adminCombinedPage.data?.data?.pagination?.total >= 1,
    'Admin combined filters with pagination'
  );

  // Empty results
  const empty = await request('GET', '/tickets', {
    token: userToken,
    query: { search: 'zzzz-no-match-phase11' },
  });
  assert(
    empty.status === 200 &&
      empty.data?.data?.tickets?.length === 0 &&
      empty.data?.data?.pagination?.total === 0,
    'Empty result handling'
  );

  // Invalid query handling
  const badPage = await request('GET', '/tickets', {
    token: userToken,
    query: { page: 0 },
  });
  assert(badPage.status === 400, 'Invalid pagination page rejected');

  const badLimit = await request('GET', '/tickets', {
    token: userToken,
    query: { limit: 101 },
  });
  assert(badLimit.status === 400, 'Maximum pagination limit enforced');

  const badSort = await request('GET', '/tickets', {
    token: userToken,
    query: { sortBy: 'title' },
  });
  assert(badSort.status === 400, 'Invalid sorting field rejected');

  const maxOk = await request('GET', '/tickets', {
    token: userToken,
    query: { limit: 100 },
  });
  assert(maxOk.status === 200 && maxOk.data?.data?.pagination?.limit === 100, 'Limit=100 accepted');

  // Dashboard stats accuracy
  const userStats = await request('GET', '/tickets/stats', { token: userToken });
  const adminStats = await request('GET', '/admin/tickets/stats', {
    token: adminToken,
  });
  assert(
    userStats.status === 200 &&
      userStats.data?.data?.stats?.total === 5 &&
      userStats.data?.data?.stats?.inProgress === 1 &&
      userStats.data?.data?.stats?.open === 4,
    'User dashboard statistics accuracy'
  );
  assert(
    adminStats.status === 200 &&
      adminStats.data?.data?.stats?.total >= 5 &&
      typeof adminStats.data?.data?.stats?.urgent === 'number' &&
      typeof adminStats.data?.data?.stats?.high === 'number',
    'Admin dashboard statistics accuracy'
  );

  const userDeniedAdminStats = await request('GET', '/admin/tickets/stats', {
    token: userToken,
  });
  assert(userDeniedAdminStats.status === 403, 'USER denied admin stats endpoint');

  await cleanup();
  await mongoose.disconnect();

  console.log(`\nPhase 11 checks: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
};

main().catch(async (err) => {
  console.error(err);
  try {
    await cleanup();
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
