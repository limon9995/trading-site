const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'withdraw', 'trade_buy', 'trade_sell', 'admin_credit', 'admin_debit', 'referral_bonus', 'binary_open', 'binary_win', 'binary_loss'],
    required: true,
  },
  coin: {
    type: String,
    default: 'USDT',
  },
  amount: {
    type: Number,
    required: true,
  },
  // USD value at time of transaction
  usdValue: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  // Reference to a trade if applicable
  trade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trade',
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);
