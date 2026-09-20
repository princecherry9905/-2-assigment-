const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    const connStr = process.env.MONGODB_URI;
    
    // Attempt standard connection first
    if (connStr) {
      if (connStr.includes('<db_password>') || connStr.includes('<password>')) {
        console.warn('⚠️ [MongoDB Warning]: Please replace <db_password> in your .env file with your actual MongoDB Atlas database password!');
      } else {
        try {
          const conn = await mongoose.connect(connStr, {
            serverSelectionTimeoutMS: 3000 // 3s timeout for Atlas cloud
          });
          console.log(`[MongoDB Atlas Connected]: ${conn.connection.host}`);
          return conn;
        } catch (err) {
          console.warn(`[MongoDB Warning]: Could not connect to Atlas URI (${err.message}). Falling back to MongoMemoryServer...`);
        }
      }
    }

    // Fallback: Use MongoMemoryServer for instant execution without local Mongo installation
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected]: In-Memory Instance (${mongoUri})`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error]: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
