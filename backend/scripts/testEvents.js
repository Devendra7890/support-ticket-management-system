/**
 * Phase 7 automated event, activity log, and notification integration tests.
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
import { hashPassword } from '../src/utils/password.js';
import {
  registerTicketListeners,
  areTicketListenersRegistered,
  getTicketListenerCounts,
} from '../src/events/eventRegistration.js';
import { ticketEmitter, emitWithHandlers } from '../src/events/ticketEmitter.js';

const BASE_URL = `http://localhost:${env.port}/api`;
const marker = `phase7-${Date.now()}`;

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
  return { token: res.data?.data?.token, userId: user?._id?.toString(), name };
};

const createAdmin = async (name, email, password) => {
  const admin = await User.create({
    name,
    email,
    password: await hashPassword(password),
    role: USER_ROLES.ADMIN,
  });
  createdUserIds.push(admin._id);
  const login = await request('POST', '/auth/login', {
    body: { email, password },
  });
  return { token: login.data?.data?.token, userId: admin._id.toString(), name };
};

const trackTicket = (ticket) => {
  if (ticket?._id) createdTicketIds.push(ticket._id);
};

const run = async () => {
  console.log(`Running Phase 7 event tests against ${BASE_URL}\n`);
  await mongoose.connect(env.mongodbUri);

  // 23. Event listeners are not registered multiple times
  {
    const first = registerTicketListeners();
    const second = registerTicketListeners();
    const counts = getTicketListenerCounts();
    const allSingle = Object.values(counts).every((count) => count === 1);
    assert(
      areTicketListenersRegistered() === true &&
        (first === true || first === false) &&
        second === false &&
        allSingle,
      '23. Event listeners are not registered multiple times',
      JSON.stringify({ first, second, counts })
    );
  }

  // 22. Async listener failures are handled safely
  {
    const testEvent = 'TEST_ASYNC_LISTENER_FAILURE';
    const failing = async () => {
      throw new Error('Intentional listener failure');
    };
    ticketEmitter.on(testEvent, failing);
    let threw = false;
    try {
      await emitWithHandlers(testEvent, { probe: true });
    } catch {
      threw = true;
    }
    ticketEmitter.off(testEvent, failing);
    assert(
      threw === false,
      '22. Async listener failures are handled safely',
      `threw=${threw}`
    );
  }

  const password = 'ValidPass123';
  const owner = await registerUser('Phase7 Owner', `${marker}-owner@example.com`, password);
  const other = await registerUser('Phase7 Other', `${marker}-other@example.com`, password);
  const admin = await createAdmin('Phase7 Admin', `${marker}-admin@example.com`, password);

  assert(Boolean(owner.token && admin.token), 'Auth setup for event tests');

  // 1-3. Ticket creation event side effects
  let ticketId = null;
  {
    const beforeLogs = await ActivityLog.countDocuments({});
    const beforeAdminNotes = await Notification.countDocuments({
      recipient: admin.userId,
      type: EVENT_TYPES.TICKET_CREATED,
    });

    const res = await request('POST', '/tickets', {
      token: owner.token,
      body: {
        title: 'Phase7 event ticket',
        description: 'Ticket used to verify event-driven activity and notifications.',
        category: 'Technical',
        priority: TICKET_PRIORITIES.HIGH,
      },
    });
    ticketId = res.data?.data?.ticket?._id;
    trackTicket(res.data?.data?.ticket);

    const createdLogs = await ActivityLog.find({
      ticket: ticketId,
      eventType: EVENT_TYPES.TICKET_CREATED,
    });
    const adminNotes = await Notification.find({
      recipient: admin.userId,
      ticket: ticketId,
      type: EVENT_TYPES.TICKET_CREATED,
    });
    const actorSelfNotes = await Notification.find({
      recipient: owner.userId,
      ticket: ticketId,
      type: EVENT_TYPES.TICKET_CREATED,
    });

    assert(res.status === 201 && createdLogs.length >= 1, '1. Ticket creation generates TICKET_CREATED', `logs=${createdLogs.length}`);
    assert(
      createdLogs.some((log) => log.description.includes('created a new support ticket')),
      '2. Ticket creation generates ActivityLog',
      createdLogs[0]?.description
    );
    assert(
      adminNotes.length >= 1 && actorSelfNotes.length === 0,
      '3. Ticket creation notifies admins',
      `adminNotes=${adminNotes.length}, self=${actorSelfNotes.length}, before=${beforeLogs}/${beforeAdminNotes}`
    );
  }

  // 4. Ticket update generates ActivityLog
  {
    const res = await request('PATCH', `/tickets/${ticketId}`, {
      token: owner.token,
      body: { title: 'Phase7 event ticket updated' },
    });
    const logs = await ActivityLog.find({
      ticket: ticketId,
      eventType: EVENT_TYPES.TICKET_UPDATED,
    });
    const adminNotes = await Notification.find({
      recipient: admin.userId,
      ticket: ticketId,
      type: EVENT_TYPES.TICKET_UPDATED,
    });
    assert(
      res.status === 200 && logs.length >= 1,
      '4. Ticket update generates ActivityLog',
      `logs=${logs.length}`
    );
    assert(
      adminNotes.length >= 1,
      '4b. Ticket update notifies admins',
      `adminNotes=${adminNotes.length}`
    );
  }

  // 5-8. Status change + resolution
  {
    await request('PATCH', `/admin/tickets/${ticketId}/status`, {
      token: admin.token,
      body: { status: TICKET_STATUSES.IN_PROGRESS },
    });

    const statusLogs = await ActivityLog.find({
      ticket: ticketId,
      eventType: EVENT_TYPES.TICKET_STATUS_CHANGED,
    });
    const statusNotes = await Notification.find({
      recipient: owner.userId,
      ticket: ticketId,
      type: EVENT_TYPES.TICKET_STATUS_CHANGED,
    });

    assert(
      statusLogs.length >= 1,
      '5. Ticket status change generates ActivityLog',
      `logs=${statusLogs.length}`
    );
    assert(
      statusNotes.length >= 1,
      '6. Ticket status change notifies ticket owner',
      `notes=${statusNotes.length}`
    );

    const beforeResolveNotes = await Notification.countDocuments({
      recipient: owner.userId,
      ticket: ticketId,
    });

    await request('PATCH', `/admin/tickets/${ticketId}/status`, {
      token: admin.token,
      body: { status: TICKET_STATUSES.RESOLVED },
    });

    const resolveLogs = await ActivityLog.find({
      ticket: ticketId,
      eventType: EVENT_TYPES.TICKET_RESOLVED,
    });
    const resolveNotes = await Notification.find({
      recipient: owner.userId,
      ticket: ticketId,
      type: EVENT_TYPES.TICKET_RESOLVED,
    });
    const statusNotesAfterResolve = await Notification.find({
      recipient: owner.userId,
      ticket: ticketId,
      type: EVENT_TYPES.TICKET_STATUS_CHANGED,
      message: /RESOLVED/,
    });

    assert(
      resolveLogs.length >= 1,
      '7. Ticket resolution generates correct activity',
      `logs=${resolveLogs.length}`
    );
    assert(
      resolveNotes.length === 1 && statusNotesAfterResolve.length === 0,
      '8. Resolution generates only one relevant notification',
      `resolveNotes=${resolveNotes.length}, statusResolvedNotes=${statusNotesAfterResolve.length}, before=${beforeResolveNotes}`
    );
  }

  // Re-open via transition RESOLVED -> OPEN for further comment tests
  await Ticket.findByIdAndUpdate(ticketId, { status: TICKET_STATUSES.OPEN });

  // 9-13. Comments
  {
    const userComment = await request('POST', `/tickets/${ticketId}/comments`, {
      token: owner.token,
      body: { message: 'User comment for event coverage' },
    });
    const userCommentLogs = await ActivityLog.find({
      ticket: ticketId,
      eventType: EVENT_TYPES.COMMENT_ADDED,
      user: owner.userId,
    });
    const adminCommentNotes = await Notification.find({
      recipient: admin.userId,
      ticket: ticketId,
      type: EVENT_TYPES.COMMENT_ADDED,
    });
    const ownerSelfCommentNotes = await Notification.find({
      recipient: owner.userId,
      ticket: ticketId,
      type: EVENT_TYPES.COMMENT_ADDED,
      message: /User comment/,
    });

    assert(
      userComment.status === 201 && userCommentLogs.length >= 1,
      '9. User comment generates COMMENT_ADDED',
      `logs=${userCommentLogs.length}`
    );

    const adminComment = await request('POST', `/tickets/${ticketId}/comments`, {
      token: admin.token,
      body: { message: 'Admin comment for event coverage' },
    });
    const adminCommentLogs = await ActivityLog.find({
      ticket: ticketId,
      eventType: EVENT_TYPES.COMMENT_ADDED,
      user: admin.userId,
    });
    const ownerNotesFromAdminComment = await Notification.find({
      recipient: owner.userId,
      ticket: ticketId,
      type: EVENT_TYPES.COMMENT_ADDED,
      message: /commented on your ticket/,
    });
    const adminSelfNotes = await Notification.find({
      recipient: admin.userId,
      ticket: ticketId,
      type: EVENT_TYPES.COMMENT_ADDED,
      message: /commented on your ticket/,
    });

    assert(
      adminComment.status === 201 && adminCommentLogs.length >= 1,
      '10. Admin comment generates COMMENT_ADDED',
      `logs=${adminCommentLogs.length}`
    );
    assert(
      adminCommentNotes.length >= 1,
      '11. User comment notifies admins',
      `notes=${adminCommentNotes.length}`
    );
    assert(
      ownerNotesFromAdminComment.length >= 1,
      '12. Admin comment notifies ticket owner',
      `notes=${ownerNotesFromAdminComment.length}`
    );
    assert(
      ownerSelfCommentNotes.length === 0 && adminSelfNotes.length === 0,
      '13. Actor does not receive their own notification',
      `ownerSelf=${ownerSelfCommentNotes.length}, adminSelf=${adminSelfNotes.length}`
    );
  }

  // 14. Ticket deletion handles audit history correctly
  {
    const deletable = await request('POST', '/tickets', {
      token: owner.token,
      body: {
        title: 'Phase7 deletable ticket',
        description: 'This ticket will be deleted to verify audit retention.',
        category: 'General',
      },
    });
    const deletableId = deletable.data?.data?.ticket?._id;
    trackTicket(deletable.data?.data?.ticket);

    const delRes = await request('DELETE', `/tickets/${deletableId}`, {
      token: owner.token,
    });
    const deletionLogs = await ActivityLog.find({
      ticket: deletableId,
      eventType: EVENT_TYPES.TICKET_DELETED,
    });
    const ticketGone = (await Ticket.findById(deletableId)) === null;
    const commentsGone = (await Comment.countDocuments({ ticket: deletableId })) === 0;
    const notesGone = (await Notification.countDocuments({ ticket: deletableId })) === 0;

    assert(
      delRes.status === 200 &&
        ticketGone &&
        commentsGone &&
        notesGone &&
        deletionLogs.length >= 1 &&
        deletionLogs[0].metadata?.ticketSnapshot?.title === 'Phase7 deletable ticket',
      '14. Ticket deletion handles audit history correctly',
      `logs=${deletionLogs.length}, snapshot=${JSON.stringify(deletionLogs[0]?.metadata?.ticketSnapshot)}`
    );

    const ownerActivity = await request('GET', `/tickets/${deletableId}/activity`, {
      token: owner.token,
    });
    const adminActivity = await request('GET', `/tickets/${deletableId}/activity`, {
      token: admin.token,
    });
    assert(
      ownerActivity.status === 404 &&
        adminActivity.status === 200 &&
        (adminActivity.data?.data?.activities || []).some(
          (a) => a.eventType === EVENT_TYPES.TICKET_DELETED
        ),
      '14b. Deleted-ticket activity visible to admin only',
      `owner=${ownerActivity.status}, admin=${adminActivity.status}`
    );
  }

  // 15-19. Notification APIs
  {
    const list = await request('GET', '/notifications', { token: owner.token });
    const notifications = list.data?.data?.notifications || [];
    const onlyOwn = notifications.every((n) => String(n.recipient) === owner.userId);

    assert(
      list.status === 200 && onlyOwn,
      '15. Notification list returns only current user\'s notifications',
      `count=${notifications.length}`
    );

    const otherList = await request('GET', '/notifications', { token: other.token });
    const leaked = (otherList.data?.data?.notifications || []).some(
      (n) => String(n.ticket) === String(ticketId) && String(n.recipient) !== other.userId
    );
    assert(
      otherList.status === 200 && leaked === false,
      '16. User cannot access another user\'s notifications',
      `leaked=${leaked}`
    );

    const ownUnread = await Notification.findOne({
      recipient: owner.userId,
      isRead: false,
    });
    const markOwn = await request('PATCH', `/notifications/${ownUnread._id}/read`, {
      token: owner.token,
    });
    const refreshed = await Notification.findById(ownUnread._id);
    assert(
      markOwn.status === 200 && refreshed.isRead === true,
      '17. User can mark own notification as read',
      `status=${markOwn.status}`
    );

    const adminNote = await Notification.findOne({ recipient: admin.userId });
    const markForeign = await request('PATCH', `/notifications/${adminNote._id}/read`, {
      token: owner.token,
    });
    assert(
      markForeign.status === 404,
      '18. User cannot mark another user\'s notification as read',
      `status=${markForeign.status}`
    );

    await Notification.updateMany(
      { recipient: owner.userId },
      { $set: { isRead: false } }
    );
    const beforeOtherUnread = await Notification.countDocuments({
      recipient: other.userId,
      isRead: false,
    });
    const readAll = await request('PATCH', '/notifications/read-all', {
      token: owner.token,
    });
    const ownerUnread = await Notification.countDocuments({
      recipient: owner.userId,
      isRead: false,
    });
    const otherUnread = await Notification.countDocuments({
      recipient: other.userId,
      isRead: false,
    });
    assert(
      readAll.status === 200 && ownerUnread === 0 && otherUnread === beforeOtherUnread,
      '19. Read-all only updates current user\'s notifications',
      `ownerUnread=${ownerUnread}, otherUnread=${otherUnread}`
    );
  }

  // 20-21. Activity API ownership
  {
    const ownerActivity = await request('GET', `/tickets/${ticketId}/activity`, {
      token: owner.token,
    });
    const otherActivity = await request('GET', `/tickets/${ticketId}/activity`, {
      token: other.token,
    });
    const adminActivity = await request('GET', `/tickets/${ticketId}/activity`, {
      token: admin.token,
    });

    assert(
      ownerActivity.status === 200 &&
        (ownerActivity.data?.data?.activities || []).length >= 1 &&
        otherActivity.status === 404,
      '20. Ticket activity API respects ownership',
      `owner=${ownerActivity.status}, other=${otherActivity.status}`
    );
    assert(
      adminActivity.status === 200 &&
        (adminActivity.data?.data?.activities || []).length >= 1,
      '21. Admin can view any ticket activity',
      `status=${adminActivity.status}`
    );
  }

  console.log('\nCleaning up temporary Phase 7 data...');
  await Promise.all([
    Comment.deleteMany({ ticket: { $in: createdTicketIds } }),
    Notification.deleteMany({
      $or: [
        { ticket: { $in: createdTicketIds } },
        { recipient: { $in: createdUserIds } },
      ],
    }),
    ActivityLog.deleteMany({
      $or: [
        { ticket: { $in: createdTicketIds } },
        { user: { $in: createdUserIds } },
      ],
    }),
    Ticket.deleteMany({ _id: { $in: createdTicketIds } }),
    Ticket.deleteMany({ createdBy: { $in: createdUserIds } }),
    User.deleteMany({ _id: { $in: createdUserIds } }),
  ]);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
};

run()
  .catch((error) => {
    console.error('Event test runner failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
