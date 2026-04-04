const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'agent'],
    default: 'user',
  },
  agentPermissions: {
    type: [String],
    enum: ['kyc_approve', 'force_trade', 'manage_deposits', 'manage_withdrawals', 'view_users'],
    default: [],
  },
  // Demo USDT balance
  demo_balance: {
    type: Number,
    default: 0,
  },
  // Holdings: { BTC: { amount, avgBuyPrice }, ETH: {...}, ... }
  holdings: {
    type: Map,
    of: new mongoose.Schema({
      amount: { type: Number, default: 0 },
      avgBuyPrice: { type: Number, default: 0 },
    }, { _id: false }),
    default: {},
  },
  // Referral system
  referralCode: {
    type: String,
    unique: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  referralEarnings: {
    type: Number,
    default: 0,
  },
  // Extended balances
  btc_balance: { type: Number, default: 0 },
  eth_balance: { type: Number, default: 0 },
  bonus_balance: { type: Number, default: 0 },

  // Investment plan
  plan: {
    type: String,
    enum: ['none', 'starter', 'pro', 'vip', 'level1', 'level2', 'level3', 'level4'],
    default: 'none',
  },
  plan_expires_at: { type: Date, default: null },

  // Total recharged amount
  total_recharged: { type: Number, default: 0 },

  // KYC / Profile info
  firstName:  { type: String, default: '' },
  lastName:   { type: String, default: '' },
  mobile:     { type: String, default: '' },
  address:    { type: String, default: '' },
  city:       { type: String, default: '' },
  zipCode:    { type: String, default: '' },
  state:      { type: String, default: '' },
  country:    { type: String, default: '' },
  kycStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  kycSubmittedAt: { type: Date, default: null },

  // Ban
  isBanned:   { type: Boolean, default: false },
  banReason:  { type: String,  default: '' },
  bannedAt:   { type: Date,    default: null },

  // Per-user trade result mode
  // 'loss' = always lose (default), 'win' = always win with fixed profit rates
  tradeMode:     { type: String, enum: ['win', 'loss'], default: 'loss' },
  tradeWinRates: {
    type: Object,
    default: { '20': 0.10, '30': 0.20, '60': 0.30, '90': 0.50, '180': 0.70 },
  },

  // Stats
  totalTraded: { type: Number, default: 0 },
  totalPnl: { type: Number, default: 0 },
  lastLogin: { type: Date },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // Generate unique referral code
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return safe user object (no password)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
