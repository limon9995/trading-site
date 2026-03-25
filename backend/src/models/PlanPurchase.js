const mongoose = require('mongoose');

const planPurchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planName:    { type: String, required: true },
  displayName: { type: String, required: true },
  price:       { type: Number, required: true },
  dailyReturn: { type: Number, required: true },
  duration:    { type: Number, required: true },
  expiresAt:   { type: Date,   required: true },
}, { timestamps: true });

module.exports = mongoose.model('PlanPurchase', planPurchaseSchema);
