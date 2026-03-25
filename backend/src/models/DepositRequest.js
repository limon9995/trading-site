const mongoose = require('mongoose');

const depositRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  coin: {
    type: String,
    required: true,
    uppercase: true,
  },
  network: {
    type: String,
    required: true,
  },
  depositAddress: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  voucherImage: {
    type: String,
    required: true, // path/URL to uploaded voucher screenshot
  },
  txHash: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  adminNote: {
    type: String,
    default: '',
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('DepositRequest', depositRequestSchema);
