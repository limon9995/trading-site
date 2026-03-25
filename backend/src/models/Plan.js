const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    enum: ['level1', 'level2', 'level3', 'level4'],
  },
  displayName: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    min: 1,
    max: 4,
    required: true,
  },
  price: {
    type: Number,
    required: true, // USDT cost to purchase
  },
  dailyReturn: {
    type: Number,
    required: true, // percentage e.g. 1.5 = 1.5%
  },
  duration: {
    type: Number,
    required: true, // days
  },
  maxReturn: {
    type: Number,
    required: true, // maximum total return percentage
  },
  tradeBonus: {
    type: Number,
    default: 0, // % bonus on trading profit
  },
  withdrawSpeed: {
    type: String,
    enum: ['normal', 'fast', 'instant'],
    default: 'normal',
  },
  features: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Plan', planSchema);
