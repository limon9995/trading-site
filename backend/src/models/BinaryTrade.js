const mongoose = require('mongoose');

const binaryTradeSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coin:       { type: String, required: true },   // 'BTC'
  direction:  { type: String, enum: ['up', 'down'], required: true },
  amount:     { type: Number, required: true },   // USDT invested
  entryPrice: { type: Number, required: true },   // price when trade placed
  closePrice: { type: Number, default: null },    // price at expiry
  duration:   { type: Number, required: true },   // seconds (30, 60, 180, 300)
  expiresAt:  { type: Date,   required: true },
  status:     { type: String, enum: ['active', 'won', 'lost'], default: 'active' },
  profit:     { type: Number, default: 0 },       // net profit/loss
  payoutRate: { type: Number, default: 0.85 },    // 85% profit on win
}, { timestamps: true });

module.exports = mongoose.model('BinaryTrade', binaryTradeSchema);
