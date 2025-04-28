import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  monitorCommands: true,
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10,
  minPoolSize: 5,
  connectTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000,  // 45 seconds
  serverSelectionTimeoutMS: 10000, // 10 seconds
  heartbeatFrequencyMS: 10000, // 10 seconds
  maxIdleTimeMS: 60000, // 1 minute
  waitQueueTimeoutMS: 10000, // 10 seconds
};

const client = new MongoClient(uri, options);

const clientPromise = client.connect()
  .then((connectedClient) => {
    console.log('✅ MongoDB connected successfully');

    connectedClient.on('commandStarted', (event) => {
      console.log('🚀 MongoDB Command Started:', {
        command: event.commandName,
        database: event.databaseName,
        commandObj: event.command,
      });
    });

    connectedClient.on('commandSucceeded', (event) => {
      console.log('✅ MongoDB Command Succeeded:', {
        command: event.commandName,
        duration: event.duration,
      });
    });

    connectedClient.on('commandFailed', (event) => {
      console.error('❌ MongoDB Command Failed:', {
        command: event.commandName,
        failure: event.failure,
      });
    });

    return connectedClient;
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  });

export default clientPromise;
