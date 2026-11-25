/**
 * Phase 6 automated comments & communication integration tests.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';
import Ticket from '../src/models/Ticket.js';
import Comment from '../src/models/Comment.js';
import { USER_ROLES } from '../src/constants/roles.js';
import { TICKET_STATUSES } from '../src/constants/ticket.js';
import { hashPassword } from '../src/utils/password.js';

const BASE_URL = `http://localhost:${env.port}/api`;
const marker = `phase6-${Date.now()}`;

const createdUserIds = [];
const createdTicketIds = [];
const createdCommentIds = [];

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
  return { token: res.data?.data?.token, userId: user?._id?.toString() };
};

const createAdmin = async (email, password) => {
  const admin = await User.create({
    name: 'Phase6 Admin',
    email,
    password: await hashPassword(password),
    role: USER_ROLES.ADMIN,
  });
  createdUserIds.push(admin._id);

  const login = await request('POST', '/auth/login', {
    body: { email, password },
  });

  return { token: login.data?.data?.token, userId: admin._id.toString() };
};

const trackTicket = (ticket) => {
  if (ticket?._id) createdTicketIds.push(ticket._id);
};

const trackComment = (comment) => {
  if (comment?._id) createdCommentIds.push(comment._id);
};

const run = async () => {
  console.log(`Running Phase 6 comment tests against ${BASE_URL}\n`);
  await mongoose.connect(env.mongodbUri);

  const password = 'ValidPass123';
  const owner = await registerUser('Phase6 Owner', `${marker}-owner@example.com`, password);
  const other = await registerUser('Phase6 Other', `${marker}-other@example.com`, password);
  const admin = await createAdmin(`${marker}-admin@example.com`, password);

  assert(Boolean(owner.token), 'Owner auth setup');
  assert(Boolean(other.token), 'Other user auth setup');
  assert(Boolean(admin.token), 'Admin auth setup');

  const ownedTicketRes = await request('POST', '/tickets', {
    token: owner.token,
    body: {
      title: 'Phase6 conversation ticket',
      description: 'Ticket used for comment communication coverage.',
      category: 'Technical',
      priority: 'MEDIUM',
    },
  });
  const ownedTicketId = ownedTicketRes.data?.data?.ticket?._id;
  trackTicket(ownedTicketRes.data?.data?.ticket);

  const otherTicketRes = await request('POST', '/tickets', {
    token: other.token,
    body: {
      title: 'Other user private conversation',
      description: 'This ticket belongs to another user for access denial tests.',
      category: 'Privacy',
      priority: 'LOW',
    },
  });
  const otherTicketId = otherTicketRes.data?.data?.ticket?._id;
  trackTicket(otherTicketRes.data?.data?.ticket);

  // 1. User successfully comments on own ticket
  {
    const res = await request('POST', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
      body: { message: 'First owner comment' },
    });
    trackComment(res.data?.data?.comment);
    assert(
      res.status === 201 &&
        res.data?.data?.comment?.message === 'First owner comment' &&
        res.data?.data?.comment?.user?.name &&
        res.data?.data?.comment?.user?.role === USER_ROLES.USER,
      '1. User successfully comments on own ticket',
      JSON.stringify(res.data)
    );
  }

  // 2. Admin successfully comments on another user's ticket
  {
    const res = await request('POST', `/tickets/${ownedTicketId}/comments`, {
      token: admin.token,
      body: { message: 'Admin response on user ticket' },
    });
    trackComment(res.data?.data?.comment);
    assert(
      res.status === 201 &&
        res.data?.data?.comment?.user?.role === USER_ROLES.ADMIN,
      '2. Admin successfully comments on another user\'s ticket',
      JSON.stringify(res.data)
    );
  }

  // 3. User cannot comment on another user's ticket
  {
    const res = await request('POST', `/tickets/${otherTicketId}/comments`, {
      token: owner.token,
      body: { message: 'Unauthorized cross-user comment' },
    });
    assert(
      res.status === 404,
      '3. User cannot comment on another user\'s ticket',
      `status=${res.status}`
    );
  }

  // 4. Unauthenticated user cannot add comments
  {
    const res = await request('POST', `/tickets/${ownedTicketId}/comments`, {
      body: { message: 'No auth comment' },
    });
    assert(
      res.status === 401,
      '4. Unauthenticated user cannot add comments',
      `status=${res.status}`
    );
  }

  // 5. Empty comment is rejected
  {
    const res = await request('POST', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
      body: { message: '   ' },
    });
    assert(res.status === 400, '5. Empty comment is rejected', `status=${res.status}`);
  }

  // 6. Missing message is rejected
  {
    const res = await request('POST', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
      body: {},
    });
    assert(res.status === 400, '6. Missing message is rejected', `status=${res.status}`);
  }

  // 7. Invalid ticket ObjectId is rejected
  {
    const res = await request('POST', '/tickets/not-valid-id/comments', {
      token: owner.token,
      body: { message: 'Invalid id path' },
    });
    assert(
      res.status === 400,
      '7. Invalid ticket ObjectId is rejected',
      `status=${res.status}`
    );
  }

  // 8. Nonexistent ticket returns 404
  {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request('POST', `/tickets/${missingId}/comments`, {
      token: owner.token,
      body: { message: 'Missing ticket comment' },
    });
    assert(
      res.status === 404,
      '8. Nonexistent ticket returns 404',
      `status=${res.status}`
    );
  }

  // 9 & 10. Comment author and ticket associations
  {
    const res = await request('POST', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
      body: { message: 'Association verification comment' },
    });
    trackComment(res.data?.data?.comment);
    const comment = res.data?.data?.comment;
    const dbComment = await Comment.findById(comment?._id);

    assert(
      String(dbComment?.user) === owner.userId &&
        comment?.user?.role === USER_ROLES.USER,
      '9. Comment author is correctly associated',
      `user=${dbComment?.user}`
    );
    assert(
      String(dbComment?.ticket) === String(ownedTicketId),
      '10. Ticket reference is correctly associated',
      `ticket=${dbComment?.ticket}`
    );
  }

  // Add delayed comments to verify chronological order
  await request('POST', `/tickets/${ownedTicketId}/comments`, {
    token: owner.token,
    body: { message: 'Chrono comment A' },
  }).then((res) => trackComment(res.data?.data?.comment));
  await new Promise((resolve) => setTimeout(resolve, 25));
  await request('POST', `/tickets/${ownedTicketId}/comments`, {
    token: admin.token,
    body: { message: 'Chrono comment B' },
  }).then((res) => trackComment(res.data?.data?.comment));

  // 11. User can view own ticket comments
  {
    const res = await request('GET', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
    });
    assert(
      res.status === 200 && (res.data?.data?.comments?.length || 0) >= 2,
      '11. User can view own ticket comments',
      `count=${res.data?.data?.comments?.length}`
    );
  }

  // 12. User cannot view another user's comments
  {
    const res = await request('GET', `/tickets/${otherTicketId}/comments`, {
      token: owner.token,
    });
    assert(
      res.status === 404,
      '12. User cannot view another user\'s comments',
      `status=${res.status}`
    );
  }

  // 13. Admin can view any ticket comments
  {
    const res = await request('GET', `/tickets/${otherTicketId}/comments`, {
      token: admin.token,
    });
    assert(
      res.status === 200,
      '13. Admin can view any ticket comments',
      `status=${res.status}`
    );
  }

  // 14. Comments are returned in chronological order
  {
    const res = await request('GET', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
      query: { limit: 100 },
    });
    const comments = res.data?.data?.comments || [];
    const timestamps = comments.map((c) => new Date(c.createdAt).getTime());
    const sorted = [...timestamps].sort((a, b) => a - b);
    assert(
      res.status === 200 && JSON.stringify(timestamps) === JSON.stringify(sorted),
      '14. Comments are returned in chronological order',
      JSON.stringify(timestamps)
    );
  }

  // 15. Password is never included in populated author information
  {
    const res = await request('GET', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
    });
    const comments = res.data?.data?.comments || [];
    const noPassword = comments.every(
      (c) => c.user && c.user.password === undefined && c.user.email === undefined
    );
    assert(
      noPassword,
      '15. Password is never included in populated author information',
      JSON.stringify(comments[0]?.user)
    );
  }

  // 16. Normal user cannot comment on resolved tickets
  {
    const resolved = await Ticket.create({
      title: 'Resolved conversation ticket',
      description: 'Resolved ticket for comment lock testing.',
      category: 'Technical',
      status: TICKET_STATUSES.RESOLVED,
      createdBy: owner.userId,
    });
    createdTicketIds.push(resolved._id);

    const res = await request('POST', `/tickets/${resolved._id}/comments`, {
      token: owner.token,
      body: { message: 'Should fail on resolved' },
    });
    assert(
      res.status === 400,
      '16. Normal user cannot comment on resolved tickets',
      `status=${res.status}`
    );
  }

  // 17. Normal user cannot comment on closed tickets
  {
    const closed = await Ticket.create({
      title: 'Closed conversation ticket',
      description: 'Closed ticket for comment lock testing.',
      category: 'Technical',
      status: TICKET_STATUSES.CLOSED,
      createdBy: owner.userId,
    });
    createdTicketIds.push(closed._id);

    const res = await request('POST', `/tickets/${closed._id}/comments`, {
      token: owner.token,
      body: { message: 'Should fail on closed' },
    });
    assert(
      res.status === 400,
      '17. Normal user cannot comment on closed tickets',
      `status=${res.status}`
    );
  }

  // 18. Admin can comment on resolved/closed tickets
  {
    const closed = await Ticket.findOne({
      createdBy: owner.userId,
      status: TICKET_STATUSES.CLOSED,
    });
    const resolved = await Ticket.findOne({
      createdBy: owner.userId,
      status: TICKET_STATUSES.RESOLVED,
    });

    const closedRes = await request('POST', `/tickets/${closed._id}/comments`, {
      token: admin.token,
      body: { message: 'Admin follow-up on closed ticket' },
    });
    trackComment(closedRes.data?.data?.comment);

    const resolvedRes = await request('POST', `/tickets/${resolved._id}/comments`, {
      token: admin.token,
      body: { message: 'Admin follow-up on resolved ticket' },
    });
    trackComment(resolvedRes.data?.data?.comment);

    assert(
      closedRes.status === 201 && resolvedRes.status === 201,
      '18. Admin can comment on resolved/closed tickets according to the implemented policy',
      `closed=${closedRes.status}, resolved=${resolvedRes.status}`
    );
  }

  // 19. Comment request cannot override user or ticket references
  {
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    const fakeTicketId = new mongoose.Types.ObjectId().toString();
    const res = await request('POST', `/tickets/${ownedTicketId}/comments`, {
      token: owner.token,
      body: {
        message: 'Mass assignment attempt',
        user: fakeUserId,
        ticket: fakeTicketId,
      },
    });
    assert(
      res.status === 400,
      '19. Comment request cannot override user or ticket references',
      `status=${res.status}, message=${res.data?.message}`
    );
  }

  console.log('\nCleaning up temporary Phase 6 data...');
  if (createdCommentIds.length > 0) {
    await Comment.deleteMany({ _id: { $in: createdCommentIds } });
  }
  await Comment.deleteMany({ ticket: { $in: createdTicketIds } });
  await Ticket.deleteMany({ _id: { $in: createdTicketIds } });
  await Ticket.deleteMany({ createdBy: { $in: createdUserIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
};

run()
  .catch((error) => {
    console.error('Comment test runner failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
