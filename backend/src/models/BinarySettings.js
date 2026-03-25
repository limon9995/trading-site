const mongoose = require('mongoose');

const binarySettingsSchema = new mongoose.Schema({
  tradingEnabled:     { type: Boolean, default: true },
  maintenanceMode:    { type: Boolean, default: false },
  demoModeEnabled:    { type: Boolean, default: false },
  defaultDemoBalance: { type: Number,  default: 10000 },
  payoutRate:         { type: Number,  default: 0.85 },   // 85% profit on win
  minTradeAmount:     { type: Number,  default: 1 },
  maxTradeAmount:     { type: Number,  default: 1000 },
  expiryTimes:        { type: [Number], default: [20, 30, 60, 90, 180] },
  availablePairs:     { type: [String], default: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE'] },
  drawBehavior:       { type: String, enum: ['return_amount', 'loss'], default: 'return_amount' },
  resultSource:       { type: String, enum: ['live', 'demo'], default: 'live' },

  // Force Result Mode:
  //   'market' = normal price-based result
  //   'win'    = force ALL trades to win (profit based on duration)
  //   'loss'   = force ALL trades to lose 100%
  forceResultMode: { type: String, enum: ['market', 'win', 'loss'], default: 'market' },

  // Forced-win profit rates per duration (key = seconds as string)
  forceWinRates: {
    type: Object,
    default: { '20': 0.10, '30': 0.20, '60': 0.30, '90': 0.50, '180': 0.70 },
  },
}, { timestamps: true });

module.exports = mongoose.model('BinarySettings', binarySettingsSchema);
