const mongoose = require('mongoose');

const forexTradeSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coin:         { type: String, required: true },       // 'BTC'
  type:         { type: String, enum: ['buy', 'sell'], required: true }, // buy=long, sell=short
  amount:       { type: Number, required: true },       // USDT margin
  leverage:     { type: Number, default: 1 },
  positionSize: { type: Number, required: true },       // amount * leverage
  entryPrice:   { type: Number, required: true },
  closePrice:   { type: Number, default: null },
  stopLoss:     { type: Number, default: null },
  takeProfit:   { type: Number, default: null },
  status:       { type: String, enum: ['open', 'closed', 'liquidated'], default: 'open' },
  pnl:          { type: Number, default: 0 },           // realized P&L in USDT
  closedAt:     { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ForexTrade', forexTradeSchema);
