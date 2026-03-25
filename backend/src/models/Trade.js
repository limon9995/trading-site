const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  coin: {
    type: String,
    required: true, // e.g. 'BTC', 'ETH'
    uppercase: true,
  },
  coinId: {
    type: String,
    required: true, // CoinGecko ID e.g. 'bitcoin'
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true,
  },
  // Amount of coin bought/sold
  coinAmount: {
    type: Number,
    required: true,
  },
  // Price per coin in USDT at trade time
  pricePerCoin: {
    type: Number,
    required: true,
  },
  // Total USDT cost/revenue
  totalUsdt: {
    type: Number,
    required: true,
  },
  // Trading fee (0.1% of trade value)
  fee: {
    type: Number,
    default: 0,
  },
  // PnL only applies to sell trades
  pnl: {
    type: Number,
    default: 0,
  },
  // Average buy price at time of sell (for PnL calculation)
  avgBuyPrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Trade', tradeSchema);
