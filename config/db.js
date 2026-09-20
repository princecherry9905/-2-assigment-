const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    const connStr = process.env.MONGODB_URI || 'mongodb+srv://princecherry964_db_user:Cherry%409905%23@cluster0.oxxmbfk.mongodb.net/ecoloop?retryWrites=true&w=majority';
    
    if (connStr) {
      if (connStr.includes('<db_password>') || connStr.includes('<password>')) {
        console.warn('⚠️ [MongoDB Warning]: Please replace <db_password> in your .env file with your actual MongoDB Atlas database password!');
      } else {
        try {
          const conn = await mongoose.connect(connStr, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000
          });
          console.log(`[MongoDB Atlas Connected]: ${conn.connection.host}`);
          return conn;
        } catch (err) {
          console.warn(`[MongoDB Warning]: Could not connect to Atlas URI (${err.message}).`);
          if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
            throw err;
          }
        }
      }
    }

    // Fallback: Use MongoMemoryServer ONLY when NOT on Vercel
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`[MongoDB Connected]: In-Memory Instance (${mongoUri})`);
      return conn;
    }
  } catch (error) {
    console.error(`[MongoDB Error]: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
