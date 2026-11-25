import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { registerTicketListeners } from './events/eventRegistration.js';

const startServer = async () => {
  try {
    await connectDB();
    registerTicketListeners();

    app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
      console.log(`Health check: http://localhost:${env.port}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
