/**
 * Phase 2 model validation script.
 * Runs schema validations and temporary create/delete checks, leaving no permanent records.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import {
  User,
  Ticket,
  Comment,
  Notification,
  ActivityLog,
} from '../src/models/index.js';
import {
  USER_ROLES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  EVENT_TYPES,
  NOTIFICATION_TYPES,
} from '../src/constants/index.js';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(env.mongodbUri);
  console.log(`Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  console.log('\n1) Syncing indexes...');
  await Promise.all([
    User.syncIndexes(),
    Ticket.syncIndexes(),
    Comment.syncIndexes(),
    Notification.syncIndexes(),
    ActivityLog.syncIndexes(),
  ]);
  console.log('Indexes synced successfully.');

  const getValidationError = async (document) => {
    try {
      await document.validate();
      return null;
    } catch (error) {
      return error;
    }
  };

  console.log('\n2) Validating required-field failures...');
  const emptyUserError = await getValidationError(new User({}));
  assert(emptyUserError?.errors?.name, 'Expected User.name required validation');
  assert(emptyUserError?.errors?.email, 'Expected User.email required validation');
  assert(emptyUserError?.errors?.password, 'Expected User.password required validation');

  const emptyTicketError = await getValidationError(new Ticket({}));
  assert(emptyTicketError?.errors?.title, 'Expected Ticket.title required validation');
  assert(emptyTicketError?.errors?.description, 'Expected Ticket.description required validation');
  assert(emptyTicketError?.errors?.category, 'Expected Ticket.category required validation');
  assert(emptyTicketError?.errors?.createdBy, 'Expected Ticket.createdBy required validation');

  const emptyCommentError = await getValidationError(new Comment({}));
  assert(emptyCommentError?.errors?.ticket, 'Expected Comment.ticket required validation');
  assert(emptyCommentError?.errors?.user, 'Expected Comment.user required validation');
  assert(emptyCommentError?.errors?.message, 'Expected Comment.message required validation');

  console.log('Required-field validations passed.');

  console.log('\n3) Validating enum constraints...');
  const badRoleError = await getValidationError(
    new User({
      name: 'Test User',
      email: 'phase2-enum@example.com',
      password: 'password123',
      role: 'SUPERADMIN',
    })
  );
  assert(badRoleError?.errors?.role, 'Expected invalid role to fail');

  const badPriorityError = await getValidationError(
    new Ticket({
      title: 'Sample ticket title',
      description: 'A sufficiently long description',
      category: 'Billing',
      priority: 'CRITICAL',
      createdBy: new mongoose.Types.ObjectId(),
    })
  );
  assert(badPriorityError?.errors?.priority, 'Expected invalid priority to fail');

  const badStatusError = await getValidationError(
    new Ticket({
      title: 'Sample ticket title',
      description: 'A sufficiently long description',
      category: 'Billing',
      status: 'PENDING',
      createdBy: new mongoose.Types.ObjectId(),
    })
  );
  assert(badStatusError?.errors?.status, 'Expected invalid status to fail');

  console.log('Enum validations passed.');

  console.log('\n4) Temporary create/delete + password select strategy...');
  const marker = `phase2-validate-${Date.now()}`;
  const email = `${marker}@example.com`;

  const user = await User.create({
    name: 'Phase 2 Validator',
    email,
    password: 'securePass123',
  });

  assert(user.role === USER_ROLES.USER, 'Default role should be USER');

  const leanUser = await User.findById(user._id).lean();
  assert(leanUser, 'User should be findable');
  assert(leanUser.password === undefined, 'Password must be excluded by default (select: false)');

  const userWithPassword = await User.findById(user._id).select('+password');
  assert(userWithPassword?.password === 'securePass123', 'Password should be retrievable with +password');

  const jsonUser = userWithPassword.toJSON();
  assert(jsonUser.password === undefined, 'toJSON must strip password');

  const ticket = await Ticket.create({
    title: 'Phase 2 validation ticket',
    description: 'Temporary ticket used only for model validation.',
    category: 'Technical',
    createdBy: user._id,
  });
  assert(ticket.priority === TICKET_PRIORITIES.MEDIUM, 'Default priority should be MEDIUM');
  assert(ticket.status === TICKET_STATUSES.OPEN, 'Default status should be OPEN');

  const comment = await Comment.create({
    ticket: ticket._id,
    user: user._id,
    message: 'Temporary validation comment',
  });

  const notification = await Notification.create({
    recipient: user._id,
    ticket: ticket._id,
    message: 'Temporary validation notification',
    type: NOTIFICATION_TYPES.TICKET_CREATED,
  });
  assert(notification.isRead === false, 'Default isRead should be false');

  const activityLog = await ActivityLog.create({
    ticket: ticket._id,
    user: user._id,
    eventType: EVENT_TYPES.TICKET_CREATED,
    description: 'Temporary validation activity log',
    metadata: { source: 'phase2-validate' },
  });
  assert(activityLog.metadata?.source === 'phase2-validate', 'Metadata should be stored');

  console.log('Temporary documents created and assertions passed.');

  console.log('\n5) Cleaning up temporary documents...');
  await Promise.all([
    ActivityLog.deleteOne({ _id: activityLog._id }),
    Notification.deleteOne({ _id: notification._id }),
    Comment.deleteOne({ _id: comment._id }),
    Ticket.deleteOne({ _id: ticket._id }),
    User.deleteOne({ _id: user._id }),
  ]);

  const remaining = await User.countDocuments({ email });
  assert(remaining === 0, 'Temporary user should be removed');
  console.log('Cleanup complete. No permanent test records left.');

  console.log('\n6) Inspecting registered indexes...');
  const collections = {
    users: User,
    tickets: Ticket,
    comments: Comment,
    notifications: Notification,
    activitylogs: ActivityLog,
  };

  for (const [name, model] of Object.entries(collections)) {
    const indexes = await model.collection.indexes();
    console.log(`\n${name} indexes:`);
    for (const index of indexes) {
      console.log(`  - ${JSON.stringify(index.key)}${index.unique ? ' [unique]' : ''}`);
    }
  }

  console.log('\nAll Phase 2 model validations passed.');
};

run()
  .catch((error) => {
    console.error('\nModel validation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
