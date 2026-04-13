require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { startBinaryTradeSettlementJob } = require('./src/controllers/binaryController');
const { startForexSettlementJob }       = require('./src/controllers/forexController');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:3000',
    'https://cexbr.com',
    'https://www.cexbr.com',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting to all requests
app.use(generalLimiter);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/trade', require('./src/routes/trade'));
app.use('/api/binary', require('./src/routes/binary'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/agent', require('./src/routes/agent'));
app.use('/api/market', require('./src/routes/market'));
app.use('/api/plans', require('./src/routes/plans'));
app.use('/api/recharge', require('./src/routes/recharge'));
app.use('/api/deposit', require('./src/routes/deposit'));
app.use('/api/forex',  require('./src/routes/forex'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/transfer', require('./src/routes/transfer'));
app.use('/api/withdraw', require('./src/routes/withdraw'));

// Serve uploaded voucher images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  startBinaryTradeSettlementJob();
  startForexSettlementJob();
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
