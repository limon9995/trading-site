const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// POST /api/transfer — transfer balance to another user by username or email
router.post('/', auth, async (req, res) => {
  try {
    const { recipient, amount, note } = req.body;
    const senderId = req.user.id;

    if (!recipient || !amount) return res.status(400).json({ error: 'Recipient and amount required' });
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (amt < 1) return res.status(400).json({ error: 'Minimum transfer is $1' });

    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ error: 'Sender not found' });
    if (sender.demo_balance < amt) return res.status(400).json({ error: 'Insufficient balance' });

    // Find recipient by username or email
    const recipientUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${recipient}$`, 'i') } },
        { email: recipient.toLowerCase() }
      ]
    });
    if (!recipientUser) return res.status(404).json({ error: 'User not found. Check username or email.' });
    if (recipientUser._id.toString() === senderId) return res.status(400).json({ error: 'Cannot transfer to yourself' });

    // Do transfer
    sender.demo_balance -= amt;
    recipientUser.demo_balance += amt;
    await sender.save();
    await recipientUser.save();

    // Log transactions
    await Transaction.create({
      user: senderId,
      type: 'admin_debit',
      amount: -amt,
      usdValue: amt,
      balanceBefore: sender.demo_balance + amt,
      description: `Transfer to @${recipientUser.username}${note ? ': ' + note : ''}`,
      balanceAfter: sender.demo_balance,
    });
    await Transaction.create({
      user: recipientUser._id,
      type: 'admin_credit',
      amount: amt,
      usdValue: amt,
      balanceBefore: recipientUser.demo_balance - amt,
      description: `Transfer from @${sender.username}${note ? ': ' + note : ''}`,
      balanceAfter: recipientUser.demo_balance,
    });

    res.json({
      message: `$${amt.toFixed(2)} transferred to @${recipientUser.username}`,
      newBalance: sender.demo_balance,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/transfer/history — get transfer history
router.get('/history', auth, async (req, res) => {
  try {
    const txns = await Transaction.find({
      user: req.user.id,
      description: /^Transfer/,
    }).sort({ createdAt: -1 }).limit(20);
    res.json({ transfers: txns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
