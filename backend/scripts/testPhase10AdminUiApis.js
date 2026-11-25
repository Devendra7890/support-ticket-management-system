/**
 * Phase 10 — verify APIs consumed by the Admin Dashboard UI against MongoDB local.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import Ticket from '../src/models/Ticket.js';
import { USER_ROLES } from '../src/constants/roles.js';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '../src/constants/ticket.js';
import { hashPassword } from '../src/utils/password.js';

const BASE_URL = `http://localhost:${env.port}/api`;
const marker = `phase10-${Date.now()}`;

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
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
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

  const userPassword = 'UserSecurePass123!';
  const adminPassword = 'AdminSecurePass123!';

  const userRes = await request('POST', '/auth/register', {
    body: {
      name: 'Phase10 User',
      email: `${marker}-user@example.com`,
      password: userPassword,
    },
  });
  const userToken = userRes.data?.data?.token;
  const userId = userRes.data?.data?.user?.id || userRes.data?.data?.user?._id;
  if (userId) createdUserIds.push(userId);
  assert(userRes.status === 201 && userToken, 'Register normal user');

  const admin = await User.create({
    name: 'Phase10 Admin',
    email: `${marker}-admin@example.com`,
    password: await hashPassword(adminPassword),
    role: USER_ROLES.ADMIN,
  });
  createdUserIds.push(admin._id);

  const adminLogin = await request('POST', '/auth/login', {
    body: { email: admin.email, password: adminPassword },
  });
  const adminToken = adminLogin.data?.data?.token;
  assert(adminLogin.status === 200 && adminToken, 'Admin login');

  const ticketRes = await request('POST', '/tickets', {
    token: userToken,
    body: {
      title: `${marker} billing issue`,
      description: 'Need help with invoice reconciliation process.',
      category: 'Billing',
      priority: TICKET_PRIORITIES.HIGH,
    },
  });
  const ticketId = ticketRes.data?.data?.ticket?._id;
  if (ticketId) createdTicketIds.push(ticketId);
  assert(ticketRes.status === 201 && ticketId, 'User creates ticket for admin UI');

  const statsTotal = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: { page: 1, limit: 1 },
  });
  assert(
    statsTotal.status === 200 &&
      typeof statsTotal.data?.data?.pagination?.total === 'number',
    'Dashboard stats via admin list pagination.total'
  );

  const listFiltered = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: {
      search: marker,
      status: TICKET_STATUSES.OPEN,
      priority: TICKET_PRIORITIES.HIGH,
      category: 'Billing',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    },
  });
  assert(
    listFiltered.status === 200 &&
      listFiltered.data?.data?.tickets?.some((t) => t._id === ticketId),
    'Admin list search/status/priority/category filters'
  );

  const creatorFilter = await request('GET', '/admin/tickets', {
    token: adminToken,
    query: { createdBy: userId, page: 1, limit: 10 },
  });
  assert(
    creatorFilter.status === 200 &&
      creatorFilter.data?.data?.tickets?.some((t) => t._id === ticketId),
    'Admin list createdBy filter'
  );

  const userDenied = await request('GET', '/admin/tickets', { token: userToken });
  assert(userDenied.status === 403, 'Normal USER denied admin tickets API');

  const details = await request('GET', `/admin/tickets/${ticketId}`, {
    token: adminToken,
  });
  assert(
    details.status === 200 &&
      details.data?.data?.ticket?._id === ticketId &&
      details.data?.data?.ticket?.createdBy?.email,
    'Admin ticket details with creator name/email'
  );

  const statusProgress = await request(
    'PATCH',
    `/admin/tickets/${ticketId}/status`,
    {
      token: adminToken,
      body: { status: TICKET_STATUSES.IN_PROGRESS },
    }
  );
  assert(
    statusProgress.status === 200 &&
      statusProgress.data?.data?.ticket?.status === TICKET_STATUSES.IN_PROGRESS,
    'Admin status update OPEN → IN_PROGRESS'
  );

  const invalidClosed = await request('PATCH', `/admin/tickets/${ticketId}/status`, {
    token: adminToken,
    body: { status: TICKET_STATUSES.CLOSED },
  });
  // IN_PROGRESS → CLOSED is allowed; force invalid by going CLOSED then reopen attempt later
  assert(
    invalidClosed.status === 200 &&
      invalidClosed.data?.data?.ticket?.status === TICKET_STATUSES.CLOSED,
    'Admin status update IN_PROGRESS → CLOSED'
  );

  const reopenClosed = await request('PATCH', `/admin/tickets/${ticketId}/status`, {
    token: adminToken,
    body: { status: TICKET_STATUSES.OPEN },
  });
  assert(
    reopenClosed.status === 400,
    'Invalid transition CLOSED → OPEN rejected by backend'
  );

  // Fresh ticket for priority + comments + activity + notifications
  const ticket2Res = await request('POST', '/tickets', {
    token: userToken,
    body: {
      title: `${marker} account access`,
      description: 'Cannot reset my password from the portal.',
      category: 'Account',
      priority: TICKET_PRIORITIES.MEDIUM,
    },
  });
  const ticket2Id = ticket2Res.data?.data?.ticket?._id;
  if (ticket2Id) createdTicketIds.push(ticket2Id);
  assert(ticket2Res.status === 201 && ticket2Id, 'Second ticket for remaining UI flows');

  const priorityUpdate = await request(
    'PATCH',
    `/admin/tickets/${ticket2Id}/priority`,
    {
      token: adminToken,
      body: { priority: TICKET_PRIORITIES.URGENT },
    }
  );
  assert(
    priorityUpdate.status === 200 &&
      priorityUpdate.data?.data?.ticket?.priority === TICKET_PRIORITIES.URGENT,
    'Admin priority update'
  );

  const commentRes = await request('POST', `/tickets/${ticket2Id}/comments`, {
    token: adminToken,
    body: { message: 'Admin is reviewing your account access request.' },
  });
  assert(commentRes.status === 201, 'Admin can reply via comments API');

  const commentsList = await request('GET', `/tickets/${ticket2Id}/comments`, {
    token: adminToken,
    query: { page: 1, limit: 50 },
  });
  assert(
    commentsList.status === 200 &&
      commentsList.data?.data?.comments?.some((c) => c.user?.role === 'ADMIN'),
    'Admin sees comments with author role'
  );

  const activity = await request('GET', `/tickets/${ticket2Id}/activity`, {
    token: adminToken,
    query: { page: 1, limit: 100 },
  });
  assert(
    activity.status === 200 &&
      (activity.data?.data?.activities?.length || 0) > 0,
    'Activity timeline loads for admin ticket details'
  );

  const notifications = await request('GET', '/notifications', {
    token: adminToken,
    query: { page: 1, limit: 50 },
  });
  assert(notifications.status === 200, 'Admin notifications list');

  const notes = notifications.data?.data?.notifications || [];
  if (notes.length > 0) {
    const unread = notes.find((n) => !n.isRead) || notes[0];
    const markOne = await request('PATCH', `/notifications/${unread._id}/read`, {
      token: adminToken,
    });
    assert(markOne.status === 200, 'Mark single admin notification read');
  } else {
    logPass('Mark single admin notification read (no notifications — skipped)');
  }

  const markAll = await request('PATCH', '/notifications/read-all', {
    token: adminToken,
  });
  assert(markAll.status === 200, 'Mark all admin notifications read');

  const userNotifIsolation = await request('GET', '/notifications', {
    token: userToken,
    query: { page: 1, limit: 50 },
  });
  const userNotes = userNotifIsolation.data?.data?.notifications || [];
  const leakedAdmin = userNotes.some(
    (n) => n.user && String(n.user) === String(admin._id)
  );
  assert(
    userNotifIsolation.status === 200 && !leakedAdmin,
    'User notifications do not expose admin-only recipient rows'
  );

  await cleanup();
  await mongoose.disconnect();

  console.log(`\nPhase 10 API checks: ${passed} passed, ${failed} failed`);
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
