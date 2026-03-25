const User = require('../models/User');
const Recharge = require('../models/Recharge');
const Transaction = require('../models/Transaction');

// POST /api/recharge
// Simulated recharge — adds funds to user USDT balance
const recharge = async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
    }
    if (parsedAmount < 10) {
      return res.status(400).json({ error: 'Minimum recharge amount is $10 USDT.' });
    }
    if (parsedAmount > 100000) {
      return res.status(400).json({ error: 'Maximum recharge amount is $100,000 USDT.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Calculate bonus (5% for amounts >= $1000)
    let bonus = 0;
    if (parsedAmount >= 5000) {
      bonus = parseFloat((parsedAmount * 0.10).toFixed(2)); // 10% bonus
    } else if (parsedAmount >= 1000) {
      bonus = parseFloat((parsedAmount * 0.05).toFixed(2)); // 5% bonus
    }

    const balanceBefore = user.demo_balance || 0;
    const totalCredit = parsedAmount + bonus;

    // Add to USDT balance
    user.demo_balance = (user.demo_balance || 0) + totalCredit;
    user.total_recharged = (user.total_recharged || 0) + parsedAmount;
    if (bonus > 0) {
      user.bonus_balance = (user.bonus_balance || 0) + bonus;
    }

    await user.save();

    // Save recharge record
    const rechargeRecord = await Recharge.create({
      user: user._id,
      amount: parsedAmount,
      bonus,
      plan: user.plan || 'none',
      status: 'completed',
    });

    // Log transaction
    await Transaction.create({
      user: user._id,
      type: 'deposit',
      coin: 'USDT',
      amount: totalCredit,
      usdValue: totalCredit,
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: `Recharge of $${parsedAmount.toFixed(2)} USDT${bonus > 0 ? ` + $${bonus.toFixed(2)} bonus` : ''}`,
    });

    res.json({
      message: `Successfully added $${totalCredit.toFixed(2)} USDT to your balance${bonus > 0 ? ` (includes $${bonus.toFixed(2)} bonus!)` : ''}`,
      amount: parsedAmount,
      bonus,
      totalCredit,
      newBalance: user.demo_balance,
      recharge: rechargeRecord,
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.status(500).json({ error: 'Failed to process recharge.' });
  }
};

// GET /api/recharge/history
const getRechargeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Recharge.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Recharge.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Recharge history error:', error);
    res.status(500).json({ error: 'Failed to fetch recharge history.' });
  }
};

module.exports = { recharge, getRechargeHistory };
