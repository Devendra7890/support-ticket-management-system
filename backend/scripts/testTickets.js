/**
 * Phase 4 automated user ticket management integration tests.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import Ticket from '../src/models/Ticket.js';
import Comment from '../src/models/Comment.js';
import Notification from '../src/models/Notification.js';
import ActivityLog from '../src/models/ActivityLog.js';
import { USER_ROLES } from '../src/constants/roles.js';
import { TICKET_STATUSES, TICKET_PRIORITIES } from '../src/constants/ticket.js';
import { EVENT_TYPES } from '../src/constants/events.js';
import { NOTIFICATION_TYPES } from '../src/constants/notifications.js';
import { hashPassword } from '../src/utils/password.js';

const BASE_URL = `http://localhost:${env.port}/api`;
const marker = `phase4-${Date.now()}`;

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

const registerAndLogin = async (name, email, password) => {
  const registerRes = await request('POST', '/auth/register', {
    body: { name, email, password },
  });

  const user = await User.findOne({ email });
  if (user) createdUserIds.push(user._id);

  return {
    token: registerRes.data?.data?.token,
    userId: user?._id?.toString(),
    registerRes,
  };
};

const trackTicket = (ticket) => {
  if (ticket?._id) createdTicketIds.push(ticket._id);
};

const run = async () => {
  console.log(`Running Phase 4 ticket tests against ${BASE_URL}\n`);
  await mongoose.connect(env.mongodbUri);

  const password = 'ValidPass123';
  const ownerEmail = `${marker}-owner@example.com`;
  const otherEmail = `${marker}-other@example.com`;

  const owner = await registerAndLogin('Ticket Owner', ownerEmail, password);
  const other = await registerAndLogin('Other User', otherEmail, password);

  assert(Boolean(owner.token), 'Owner auth setup', JSON.stringify(owner.registerRes.data));
  assert(Boolean(other.token), 'Other user auth setup', JSON.stringify(other.registerRes.data));

  let ownedTicketId = null;
  let searchableTicketId = null;

  // 1. Create ticket successfully
  {
    const res = await request('POST', '/tickets', {
      token: owner.token,
      body: {
        title: 'Unable to login',
        description: 'I cannot access my account after password reset.',
        category: 'Technical',
        priority: 'HIGH',
      },
    });
    trackTicket(res.data?.data?.ticket);
    ownedTicketId = res.data?.data?.ticket?._id;
    assert(
      res.status === 201 &&
        res.data?.data?.ticket?.status === TICKET_STATUSES.OPEN &&
        res.data?.data?.ticket?.priority === TICKET_PRIORITIES.HIGH &&
        String(res.data?.data?.ticket?.createdBy) === owner.userId,
      '1. Create ticket successfully',
      JSON.stringify(res.data)
    );
  }

  // 2. Create ticket without authentication
  {
    const res = await request('POST', '/tickets', {
      body: {
        title: 'No auth ticket',
        description: 'This should be rejected without a token.',
        category: 'Technical',
      },
    });
    assert(res.status === 401, '2. Create ticket without authentication', `status=${res.status}`);
  }

  // 3. Create ticket with invalid data
  {
    const res = await request('POST', '/tickets', {
      token: owner.token,
      body: {
        title: 'Hi',
        description: 'Too short',
        category: '',
      },
    });
    assert(res.status === 400, '3. Create ticket with invalid data', `status=${res.status}`);
  }

  // 4. Create ticket with invalid priority
  {
    const res = await request('POST', '/tickets', {
      token: owner.token,
      body: {
        title: 'Invalid priority ticket',
        description: 'Priority value should be rejected by validation.',
        category: 'Billing',
        priority: 'CRITICAL',
      },
    });
    assert(res.status === 400, '4. Create ticket with invalid priority', `status=${res.status}`);
  }

  // 5. Attempt to provide createdBy manually
  {
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const res = await request('POST', '/tickets', {
      token: owner.token,
      body: {
        title: 'Mass assignment ticket',
        description: 'Client must not be allowed to set createdBy.',
        category: 'Security',
        createdBy: fakeUserId,
      },
    });
    assert(
      res.status === 400,
      '5. Attempt to provide createdBy manually',
      `status=${res.status}, message=${res.data?.message}`
    );
  }

  // Create extra tickets for list/filter/search/pagination
  {
    const samples = [
      {
        title: 'Billing invoice mismatch',
        description: 'Invoice total does not match subscribed plan.',
        category: 'Billing',
        priority: 'LOW',
      },
      {
        title: 'Searchable network outage',
        description: 'Network intermittent outages in the office.',
        category: 'Technical',
        priority: 'URGENT',
      },
      {
        title: 'Default priority sample',
        description: 'This ticket omits priority and should default to MEDIUM.',
        category: 'General',
      },
    ];

    for (const sample of samples) {
      const res = await request('POST', '/tickets', {
        token: owner.token,
        body: sample,
      });
      trackTicket(res.data?.data?.ticket);
      if (sample.title.includes('Searchable')) {
        searchableTicketId = res.data?.data?.ticket?._id;
      }
      if (!sample.priority) {
        assert(
          res.data?.data?.ticket?.priority === TICKET_PRIORITIES.MEDIUM,
          'Default priority MEDIUM when omitted',
          `priority=${res.data?.data?.ticket?.priority}`
        );
      }
    }

    // Other user's ticket (should never appear for owner)
    const otherTicket = await request('POST', '/tickets', {
      token: other.token,
      body: {
        title: 'Other user private ticket',
        description: 'This ticket belongs to another authenticated user.',
        category: 'Privacy',
        priority: 'MEDIUM',
      },
    });
    trackTicket(otherTicket.data?.data?.ticket);
  }

  // 6. Get own tickets
  {
    const res = await request('GET', '/tickets', { token: owner.token });
    const tickets = res.data?.data?.tickets || [];
    const onlyOwn = tickets.every((t) => String(t.createdBy) === owner.userId);
    assert(
      res.status === 200 && tickets.length >= 4 && onlyOwn,
      '6. Get own tickets',
      `count=${tickets.length}, onlyOwn=${onlyOwn}`
    );
  }

  // 7. Get individual own ticket
  {
    const res = await request('GET', `/tickets/${ownedTicketId}`, {
      token: owner.token,
    });
    assert(
      res.status === 200 && res.data?.data?.ticket?._id === ownedTicketId,
      '7. Get individual own ticket',
      JSON.stringify(res.data)
    );
  }

  // 8. Access another user's ticket
  {
    const otherTickets = await request('GET', '/tickets', { token: other.token });
    const foreignId = otherTickets.data?.data?.tickets?.[0]?._id;
    const res = await request('GET', `/tickets/${foreignId}`, {
      token: owner.token,
    });
    assert(
      res.status === 404 && res.data?.message === 'Ticket not found.',
      '8. Access another user\'s ticket',
      `status=${res.status}, message=${res.data?.message}`
    );
  }

  // 9. Update own ticket
  {
    const res = await request('PATCH', `/tickets/${ownedTicketId}`, {
      token: owner.token,
      body: {
        title: 'Unable to login - updated',
        priority: 'URGENT',
      },
    });
    assert(
      res.status === 200 &&
        res.data?.data?.ticket?.title === 'Unable to login - updated' &&
        res.data?.data?.ticket?.priority === 'URGENT',
      '9. Update own ticket',
      JSON.stringify(res.data)
    );
  }

  // 10. Attempt to update another user's ticket
  {
    const otherTickets = await request('GET', '/tickets', { token: other.token });
    const foreignId = otherTickets.data?.data?.tickets?.[0]?._id;
    const res = await request('PATCH', `/tickets/${foreignId}`, {
      token: owner.token,
      body: { title: 'Hijacked title update attempt' },
    });
    assert(res.status === 404, '10. Attempt to update another user\'s ticket', `status=${res.status}`);
  }

  // 11. Attempt to change status through PATCH
  {
    const res = await request('PATCH', `/tickets/${ownedTicketId}`, {
      token: owner.token,
      body: { status: TICKET_STATUSES.RESOLVED },
    });
    assert(res.status === 400, '11. Attempt to change status through PATCH', `status=${res.status}`);
  }

  // 12. Attempt to change createdBy
  {
    const res = await request('PATCH', `/tickets/${ownedTicketId}`, {
      token: owner.token,
      body: { createdBy: other.userId },
    });
    assert(res.status === 400, '12. Attempt to change createdBy', `status=${res.status}`);
  }

  // 13. Update resolved ticket
  {
    const resolved = await Ticket.create({
      title: 'Resolved ticket sample',
      description: 'This ticket is already resolved and locked.',
      category: 'Technical',
      priority: TICKET_PRIORITIES.LOW,
      status: TICKET_STATUSES.RESOLVED,
      createdBy: owner.userId,
    });
    createdTicketIds.push(resolved._id);

    const res = await request('PATCH', `/tickets/${resolved._id}`, {
      token: owner.token,
      body: { title: 'Should not update resolved' },
    });
    assert(res.status === 400, '13. Update resolved ticket', `status=${res.status}`);
  }

  // 14. Delete own ticket (with related data cleanup)
  {
    const toDelete = await Ticket.create({
      title: 'Ticket pending deletion',
      description: 'Temporary ticket created for delete coverage.',
      category: 'General',
      createdBy: owner.userId,
    });
    createdTicketIds.push(toDelete._id);

    await Comment.create({
      ticket: toDelete._id,
      user: owner.userId,
      message: 'Related comment that must be removed',
    });
    await Notification.create({
      recipient: owner.userId,
      ticket: toDelete._id,
      message: 'Related notification',
      type: NOTIFICATION_TYPES.TICKET_CREATED,
    });
    await ActivityLog.create({
      ticket: toDelete._id,
      user: owner.userId,
      eventType: EVENT_TYPES.TICKET_CREATED,
      description: 'Related activity log',
    });

    const res = await request('DELETE', `/tickets/${toDelete._id}`, {
      token: owner.token,
    });

    const leftovers = await Promise.all([
      Ticket.findById(toDelete._id),
      Comment.countDocuments({ ticket: toDelete._id }),
      Notification.countDocuments({ ticket: toDelete._id }),
      ActivityLog.countDocuments({ ticket: toDelete._id }),
    ]);

    // Activity logs are retained after deletion for audit history (Phase 7).
    // Comments and notifications are cascade-removed.
    assert(
      res.status === 200 &&
        leftovers[0] === null &&
        leftovers[1] === 0 &&
        leftovers[2] === 0 &&
        leftovers[3] >= 1,
      '14. Delete own ticket',
      `status=${res.status}, leftovers=${JSON.stringify(leftovers)}`
    );
  }

  // 15. Attempt to delete another user's ticket
  {
    const otherTickets = await request('GET', '/tickets', { token: other.token });
    const foreignId = otherTickets.data?.data?.tickets?.[0]?._id;
    const res = await request('DELETE', `/tickets/${foreignId}`, {
      token: owner.token,
    });
    assert(res.status === 404, '15. Attempt to delete another user\'s ticket', `status=${res.status}`);
  }

  // 16. Delete closed ticket
  {
    const closed = await Ticket.create({
      title: 'Closed ticket sample',
      description: 'This ticket is closed and cannot be deleted by user.',
      category: 'Technical',
      status: TICKET_STATUSES.CLOSED,
      createdBy: owner.userId,
    });
    createdTicketIds.push(closed._id);

    const res = await request('DELETE', `/tickets/${closed._id}`, {
      token: owner.token,
    });
    assert(res.status === 400, '16. Delete closed ticket', `status=${res.status}`);
  }

  // 17. Filter tickets by status
  {
    const res = await request('GET', '/tickets', {
      token: owner.token,
      query: { status: TICKET_STATUSES.OPEN },
    });
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 && tickets.every((t) => t.status === TICKET_STATUSES.OPEN),
      '17. Filter tickets by status',
      `count=${tickets.length}`
    );
  }

  // 18. Filter tickets by priority
  {
    const res = await request('GET', '/tickets', {
      token: owner.token,
      query: { priority: TICKET_PRIORITIES.URGENT },
    });
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 && tickets.every((t) => t.priority === TICKET_PRIORITIES.URGENT),
      '18. Filter tickets by priority',
      `count=${tickets.length}`
    );
  }

  // 19. Search tickets
  {
    const res = await request('GET', '/tickets', {
      token: owner.token,
      query: { search: 'network outage' },
    });
    const tickets = res.data?.data?.tickets || [];
    assert(
      res.status === 200 &&
        tickets.length >= 1 &&
        tickets.some((t) => t._id === searchableTicketId),
      '19. Search tickets',
      `count=${tickets.length}`
    );
  }

  // 20. Pagination and sorting
  {
    const res = await request('GET', '/tickets', {
      token: owner.token,
      query: {
        page: 1,
        limit: 2,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
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
      '20. Pagination and sorting',
      JSON.stringify(pagination)
    );
  }

  // 21. Invalid MongoDB ObjectId
  {
    const res = await request('GET', '/tickets/not-a-valid-id', {
      token: owner.token,
    });
    assert(res.status === 400, '21. Invalid MongoDB ObjectId', `status=${res.status}`);
  }

  // 22. Empty update payload
  {
    const res = await request('PATCH', `/tickets/${ownedTicketId}`, {
      token: owner.token,
      body: {},
    });
    assert(res.status === 400, '22. Empty update payload', `status=${res.status}`);
  }

  console.log('\nCleaning up temporary Phase 4 data...');
  if (createdTicketIds.length > 0) {
    await Promise.all([
      Comment.deleteMany({ ticket: { $in: createdTicketIds } }),
      Notification.deleteMany({ ticket: { $in: createdTicketIds } }),
      ActivityLog.deleteMany({ ticket: { $in: createdTicketIds } }),
      Ticket.deleteMany({ _id: { $in: createdTicketIds } }),
    ]);
  }
  await Ticket.deleteMany({ createdBy: { $in: createdUserIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
};

run()
  .catch((error) => {
    console.error('Ticket test runner failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
