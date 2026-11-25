/**
 * Phase 5 automated admin ticket management integration tests.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import Ticket from '../src/models/Ticket.js';
import { USER_ROLES } from '../src/constants/roles.js';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../src/constants/ticket.js';
import { hashPassword } from '../src/utils/password.js';

const BASE_URL = `http://localhost:${env.port}/api`;
const marker = `phase5-${Date.now()}`;

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
    url += `?${params.toString()}`;
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

const registerUser = async (name, email, password) => {
  const res = await request('POST', '/auth/register', {
    body: { name, email, password },
  });
  const user = await User.findOne({ email });
  if (user) createdUserIds.push(user._id);
  return { token: res.data?.data?.token, userId: user?._id?.toString(), res };
};

const createAdmin = async (email, password) => {
  const admin = await User.create({
    name: 'Phase5 Admin',
    email,
    password: await hashPassword(password),
    role: USER_ROLES.ADMIN,
  });
  createdUserIds.push(admin._id);

  const login = await request('POST', '/auth/login', {
    body: { email, password },
  });

  return {
    token: login.data?.data?.token,
    userId: admin._id.toString(),
  };
};

const trackTicket = (ticket) => {
  if (ticket?._id) createdTicketIds.push(ticket._id);
};

const run = async () => {
  console.log(`Running Phase 5 admin ticket tests against ${BASE_URL}\n`);
  await mongoose.connect(env.mongodbUri);

  const password = 'ValidPass123';
  const userA = await registerUser('Phase5 User A', `${marker}-a@example.com`, password);
  const userB = await registerUser('Phase5 User B', `${marker}-b@example.com`, password);
  const admin = await createAdmin(`${marker}-admin@example.com`, password);

  assert(Boolean(userA.token), 'User A auth setup');
  assert(Boolean(userB.token), 'User B auth setup');
  assert(Boolean(admin.token), 'Admin auth setup');

  // Seed tickets via user APIs
  const seeded = [];
  const samples = [
    {
      owner: userA,
      title: 'Admin list alpha billing issue',
      description: 'Billing discrepancy for subscription renewal cycle.',
      category: 'Billing',
      priority: TICKET_PRIORITIES.HIGH,
    },
    {
      owner: userA,
      title: 'Admin searchable network failure',
      description: 'Network packet loss observed on office wifi.',
      category: 'Technical',
      priority: TICKET_PRIORITIES.URGENT,
    },
    {
      owner: userB,
      title: 'Admin list beta account access',
      description: 'User cannot reset password from the portal.',
      category: 'Account',
      priority: TICKET_PRIORITIES.LOW,
    },
  ];

  for (const sample of samples) {
    const res = await request('POST', '/tickets', {
      token: sample.owner.token,
      body: {
        title: sample.title,
        description: sample.description,
        category: sample.category,
        priority: sample.priority,
      },
    });
    trackTicket(res.data?.data?.ticket);
    seeded.push(res.data?.data?.ticket);
  }

  const primaryTicketId = seeded[0]?._id;

  // 1. Admin successfully views all tickets
  {
    const res = await request('GET', '/admin/tickets', { token: admin.token });
    const tickets = res.data?.data?.tickets || [];
    const hasBothOwners =
      tickets.some((t) => String(t.createdBy?._id || t.createdBy) === userA.userId) &&
      tickets.some((t) => String(t.createdBy?._id || t.createdBy) === userB.userId);
    const safeCreator = tickets.every(
      (t) =>
        t.createdBy?.name &&
        t.createdBy?.email &&
        t.createdBy?.password === undefined
    );
    assert(
      res.status === 200 && tickets.length >= 3 && hasBothOwners && safeCreator,
      '1. Admin successfully views all tickets',
      `status=${res.status}, count=${tickets.length}, hasBothOwners=${hasBothOwners}, safeCreator=${safeCreator}`
    );
  }

  // 2. USER cannot access admin ticket list
  {
    const res = await request('GET', '/admin/tickets', { token: userA.token });
    assert(res.status === 403, '2. USER cannot access admin ticket list', `status=${res.status}`);
  }

  // 3. Unauthenticated user cannot access admin routes
  {
    const res = await request('GET', '/admin/tickets');
    assert(
      res.status === 401,
      '3. Unauthenticated user cannot access admin routes',
      `status=${res.status}`
    );
  }

  // 4. Admin can filter by status
  {
    const res = await request('GET', '/admin/tickets', {
      token: admin.token,
      query: { status: TICKET_STATUSES.OPEN },
    });
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 && tickets.every((t) => t.status === TICKET_STATUSES.OPEN),
      '4. Admin can filter by status',
      `count=${tickets.length}`
    );
  }

  // 5. Admin can filter by priority
  {
    const res = await request('GET', '/admin/tickets', {
      token: admin.token,
      query: { priority: TICKET_PRIORITIES.URGENT },
    });
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 &&
        tickets.length >= 1 &&
        tickets.every((t) => t.priority === TICKET_PRIORITIES.URGENT),
      '5. Admin can filter by priority',
      `count=${tickets.length}`
    );
  }

  // 6. Admin can filter by category
  {
    const res = await request('GET', '/admin/tickets', {
      token: admin.token,
      query: { category: 'Billing' },
    });
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 &&
        tickets.length >= 1 &&
        tickets.every((t) => t.category === 'Billing'),
      '6. Admin can filter by category',
      `count=${tickets.length}`
    );
  }

  // 7. Admin can search tickets
  {
    const res = await request('GET', '/admin/tickets', {
      token: admin.token,
      query: { search: 'network failure' },
    });
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 && tickets.some((t) => t.title.includes('network failure')),
      '7. Admin can search tickets',
      `count=${tickets.length}`
    );
  }

  // 8. Admin pagination works correctly
  {
    const res = await request('GET', '/admin/tickets', {
      token: admin.token,
      query: { page: 1, limit: 2 },
    });
    const pagination = res.data?.data?.pagination;
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 &&
        tickets.length <= 2 &&
        pagination?.page === 1 &&
        pagination?.limit === 2 &&
        typeof pagination?.total === 'number' &&
        typeof pagination?.totalPages === 'number',
      '8. Admin pagination works correctly',
      JSON.stringify(pagination)
    );
  }

  // 9. Admin sorting works correctly
  {
    const res = await request('GET', '/admin/tickets', {
      token: admin.token,
      query: { sortBy: 'priority', sortOrder: 'asc', limit: 50 },
    });
    const tickets = res.data?.data?.tickets || [];
    const priorities = tickets.map((t) => t.priority);
    const sorted = [...priorities].sort((a, b) => a.localeCompare(b));
    assert(
      res.status === 200 && JSON.stringify(priorities) === JSON.stringify(sorted),
      '9. Admin sorting works correctly',
      JSON.stringify(priorities)
    );
  }

  // 10. Admin can view ticket details
  {
    const res = await request('GET', `/admin/tickets/${primaryTicketId}`, {
      token: admin.token,
    });
    assert(
      res.status === 200 &&
        res.data?.data?.ticket?._id === primaryTicketId &&
        res.data?.data?.ticket?.createdBy?.email &&
        res.data?.data?.ticket?.createdBy?.password === undefined,
      '10. Admin can view ticket details',
      JSON.stringify(res.data)
    );
  }

  // 11. Admin receives 404 for nonexistent ticket
  {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request('GET', `/admin/tickets/${missingId}`, {
      token: admin.token,
    });
    assert(
      res.status === 404,
      '11. Admin receives 404 for invalid/nonexistent ticket',
      `status=${res.status}`
    );
  }

  // 12. Admin can update ticket status
  {
    const res = await request('PATCH', `/admin/tickets/${primaryTicketId}/status`, {
      token: admin.token,
      body: { status: TICKET_STATUSES.IN_PROGRESS },
    });
    assert(
      res.status === 200 &&
        res.data?.data?.ticket?.status === TICKET_STATUSES.IN_PROGRESS &&
        res.data?.data?.transition?.from === TICKET_STATUSES.OPEN &&
        res.data?.data?.transition?.to === TICKET_STATUSES.IN_PROGRESS,
      '12. Admin can update ticket status',
      JSON.stringify(res.data)
    );
  }

  // 13. Admin can update ticket priority
  {
    const res = await request('PATCH', `/admin/tickets/${primaryTicketId}/priority`, {
      token: admin.token,
      body: { priority: TICKET_PRIORITIES.LOW },
    });
    assert(
      res.status === 200 &&
        res.data?.data?.ticket?.priority === TICKET_PRIORITIES.LOW &&
        res.data?.data?.transition?.to === TICKET_PRIORITIES.LOW,
      '13. Admin can update ticket priority',
      JSON.stringify(res.data)
    );
  }

  // 14. Invalid status is rejected
  {
    const res = await request('PATCH', `/admin/tickets/${primaryTicketId}/status`, {
      token: admin.token,
      body: { status: 'PENDING' },
    });
    assert(res.status === 400, '14. Invalid status is rejected', `status=${res.status}`);
  }

  // 15. Invalid priority is rejected
  {
    const res = await request('PATCH', `/admin/tickets/${primaryTicketId}/priority`, {
      token: admin.token,
      body: { priority: 'CRITICAL' },
    });
    assert(res.status === 400, '15. Invalid priority is rejected', `status=${res.status}`);
  }

  // 16. User cannot update status through admin endpoint
  {
    const res = await request('PATCH', `/admin/tickets/${primaryTicketId}/status`, {
      token: userA.token,
      body: { status: TICKET_STATUSES.RESOLVED },
    });
    assert(
      res.status === 403,
      '16. User cannot update status through admin endpoint',
      `status=${res.status}`
    );
  }

  // 17. User cannot update priority through admin endpoint
  {
    const res = await request('PATCH', `/admin/tickets/${primaryTicketId}/priority`, {
      token: userA.token,
      body: { priority: TICKET_PRIORITIES.MEDIUM },
    });
    assert(
      res.status === 403,
      '17. User cannot update priority through admin endpoint',
      `status=${res.status}`
    );
  }

  // 18. Request cannot update unrelated ticket fields
  {
    const before = await Ticket.findById(primaryTicketId);
    const res = await request('PATCH', `/admin/tickets/${primaryTicketId}/status`, {
      token: admin.token,
      body: {
        status: TICKET_STATUSES.RESOLVED,
        title: 'Hacked title',
        priority: TICKET_PRIORITIES.URGENT,
      },
    });
    const after = await Ticket.findById(primaryTicketId);
    assert(
      res.status === 400 &&
        after.title === before.title &&
        after.priority === before.priority &&
        after.status === before.status,
      '18. Request cannot update unrelated ticket fields',
      `status=${res.status}, titleChanged=${after.title !== before.title}`
    );
  }

  // 19. Existing user ticket APIs continue working
  {
    const list = await request('GET', '/tickets', { token: userA.token });
    const detail = await request('GET', `/tickets/${seeded[1]._id}`, {
      token: userA.token,
    });
    assert(
      list.status === 200 &&
        detail.status === 200 &&
        (list.data?.data?.tickets || []).every(
          (t) => String(t.createdBy) === userA.userId
        ),
      '19. Existing user ticket APIs continue working',
      `list=${list.status}, detail=${detail.status}`
    );
  }

  // Bonus: /admin/check still works
  {
    const res = await request('GET', '/admin/check', { token: admin.token });
    assert(res.status === 200, 'Admin check endpoint still works', `status=${res.status}`);
  }

  console.log('\nCleaning up temporary Phase 5 data...');
  if (createdTicketIds.length > 0) {
    await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  }
  await Ticket.deleteMany({ createdBy: { $in: createdUserIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
};

run()
  .catch((error) => {
    console.error('Admin ticket test runner failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
