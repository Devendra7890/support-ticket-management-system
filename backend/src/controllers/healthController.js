import mongoose from 'mongoose';

export const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected
      ? 'Support Ticket Management API is healthy'
      : 'API is running but database is not connected',
    data: {
      service: 'support-ticket-management-api',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatusMap[dbState] || 'unknown',
        name: mongoose.connection.name || null,
      },
    },
  });
};
