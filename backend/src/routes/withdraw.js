const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const WithdrawRequest = require('../models/WithdrawRequest');
const { sendWithdrawOTP } = require('../utils/mailer');

const WITHDRAW_FEE_RATE = 0.02; // 2%
const MIN_WITHDRAW = 10;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory OTP store: { userId: { otp, expiresAt, pendingData } }
const otpStore = new Map();

// POST /api/withdraw/send-otp — send OTP to user's email
router.post('/send-otp', auth, async (req, res) => {
  try {
    const { coin, network, address, amount } = req.body;
    if (!coin || !network || !address || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (amt < MIN_WITHDRAW) return res.status(400).json({ error: `Minimum withdrawal is $${MIN_WITHDRAW}` });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.demo_balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    // Store OTP with pending withdrawal data
    otpStore.set(req.user.id, {
      otp,
      expiresAt,
      pendingData: { coin: coin.toUpperCase(), network, address, amount: amt },
    });

    // Send OTP email
    await sendWithdrawOTP(user.email, otp, amt.toFixed(2));

    res.json({
      message: `OTP sent to ${user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`,
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (err) {
    console.error('OTP send error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Check email configuration.' });
  }
});

// POST /api/withdraw/verify-otp — verify OTP and submit withdrawal
router.post('/verify-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required' });

    const stored = otpStore.get(req.user.id);
    if (!stored) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(req.user.id);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    if (stored.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // OTP verified — process withdrawal
    otpStore.delete(req.user.id);
    const { coin, network, address, amount: amt } = stored.pendingData;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.demo_balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

    const fee = parseFloat((amt * WITHDRAW_FEE_RATE).toFixed(2));
    const netAmount = parseFloat((amt - fee).toFixed(2));

    // Deduct balance immediately (temporary lock)
    const balanceBefore = user.demo_balance;
    user.demo_balance = parseFloat((user.demo_balance - amt).toFixed(2));
    await user.save();

    // Create withdraw request
    const request = await WithdrawRequest.create({
      user: user._id,
      coin,
      network,
      address,
      amount: amt,
      fee,
      netAmount,
    });

    await Transaction.create({
      user: user._id,
      type: 'withdraw',
      coin,
      amount: amt,
      usdValue: amt,
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: `Withdrawal request pending: ${amt} USDT via ${network}`,
    });

    res.json({
      message: 'Withdrawal request submitted. Pending admin review.',
      requestId: request._id,
      newBalance: user.demo_balance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/withdraw/history — user's withdraw history
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      WithdrawRequest.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WithdrawRequest.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
