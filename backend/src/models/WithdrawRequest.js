const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  coin: { type: String, required: true, uppercase: true },
  network: { type: String, required: true },
  address: { type: String, required: true },
  amount: { type: Number, required: true },       // amount user entered
  fee: { type: Number, default: 1 },              // network fee in USDT
  netAmount: { type: Number, required: true },    // amount - fee
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  adminNote: { type: String, default: '' },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);
