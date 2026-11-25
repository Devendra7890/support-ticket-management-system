/**
 * One-off cleanup: remove notifications for deleted tickets and Phase test noise.
 * Usage: node scripts/cleanupStaleNotifications.js
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';

const cleanup = async () => {
  await mongoose.connect(env.mongodbUri);
  const db = mongoose.connection.db;
  const notifications = db.collection('notifications');
  const tickets = db.collection('tickets');

  const all = await notifications
    .find({})
    .project({ _id: 1, ticket: 1, message: 1 })
    .toArray();

  const ticketIds = [
    ...new Set(all.map((n) => (n.ticket ? String(n.ticket) : null)).filter(Boolean)),
  ];

  const existingIds = ticketIds.length
    ? (
        await tickets
          .find({
            _id: { $in: ticketIds.map((id) => new mongoose.Types.ObjectId(id)) },
          })
          .project({ _id: 1 })
          .toArray()
      ).map((t) => String(t._id))
    : [];

  const existing = new Set(existingIds);

  const staleIds = all
    .filter((n) => {
      const msg = n.message || '';
      const ticketGone = Boolean(n.ticket) && !existing.has(String(n.ticket));
      const testNoise = /phase1[0-2]|Phase1[0-2]/i.test(msg);
      return ticketGone || testNoise;
    })
    .map((n) => n._id);

  const before = await notifications.countDocuments();
  const result = await notifications.deleteMany({ _id: { $in: staleIds } });
  const after = await notifications.countDocuments();

  console.log(`Notifications before: ${before}`);
  console.log(`Matched for delete: ${staleIds.length}`);
  console.log(`Deleted: ${result.deletedCount}`);
  console.log(`Notifications after: ${after}`);
};

cleanup()
  .catch((error) => {
    console.error('Cleanup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
