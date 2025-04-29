import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000,  // 45 seconds
  serverSelectionTimeoutMS: 10000, // 10 seconds
  heartbeatFrequencyMS: 10000, // 10 seconds
  maxIdleTimeMS: 60000, // 1 minute
  waitQueueTimeoutMS: 10000, // 10 seconds
};

// Define the type for the cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare the global mongoose property
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

// Initialize cached with a default value to avoid undefined errors
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Set the global mongoose if it doesn't exist
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToMongoDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      ...options,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      console.log('✅ Mongoose connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToMongoDB; 