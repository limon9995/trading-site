const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_trading',
      {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS:          60000,
        connectTimeoutMS:         15000,
        maxPoolSize:              5,
        retryWrites:              true,
      }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — reconnecting in 5s...');
      setTimeout(connectDB, 5000);
    });
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err.message);
    });
  } catch (error) {
    console.error(`❌ MongoDB error: ${error.message}`);
    console.log('Retrying in 8 seconds...');
    setTimeout(connectDB, 8000);
  }
};

module.exports = connectDB;
