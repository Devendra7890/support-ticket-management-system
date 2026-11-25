import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongodbUri);
    console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

export default connectDB;
