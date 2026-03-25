const mongoose = require('mongoose');

const depositAddressSchema = new mongoose.Schema({
  coin: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  }, // e.g. USDT, BTC, ETH, BNB, TRX
  network: {
    type: String,
    required: true,
    trim: true,
  }, // e.g. TRC20, ERC20, BEP20, Bitcoin
  address: {
    type: String,
    required: true,
    trim: true,
  },
  minDeposit: {
    type: Number,
    default: 10,
  },
  note: {
    type: String,
    default: '',
  }, // Optional note shown to user
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('DepositAddress', depositAddressSchema);
