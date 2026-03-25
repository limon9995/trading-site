const User = require('../models/User');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const Recharge = require('../models/Recharge');
const DepositAddress = require('../models/DepositAddress');
const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const PlanPurchase = require('../models/PlanPurchase');
const { validationResult } = require('express-validator');

// GET /api/admin/users - list all users with stats
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = search
      ? { $or: [{ email: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// GET /api/admin/trades - all trades
const getAllTrades = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [trades, total] = await Promise.all([
      Trade.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('user', 'username email'),
      Trade.countDocuments(),
    ]);

    res.json({
      trades,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades.' });
  }
};

// PATCH /api/admin/users/:id/balance - modify user balance
const modifyBalance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { amount, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const balanceBefore = user.demo_balance;
    const delta = parseFloat(amount);
    user.demo_balance = Math.max(0, user.demo_balance + delta);
    await user.save();

    // Log the admin action as a transaction
    await Transaction.create({
      user: user._id,
      type: delta >= 0 ? 'admin_credit' : 'admin_debit',
      coin: 'USDT',
      amount: Math.abs(delta),
      usdValue: Math.abs(delta),
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: reason || `Admin ${delta >= 0 ? 'credit' : 'debit'} of $${Math.abs(delta)}`,
    });

    res.json({
      message: `Balance updated. New balance: $${user.demo_balance.toFixed(2)}`,
      newBalance: user.demo_balance,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to modify balance.' });
  }
};

// GET /api/admin/stats - platform overview
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalTrades, recentTrades] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Trade.countDocuments(),
      Trade.find().sort({ createdAt: -1 }).limit(10).populate('user', 'username'),
    ]);

    // Total volume aggregation
    const volumeAgg = await Trade.aggregate([
      { $group: { _id: null, totalVolume: { $sum: '$totalUsdt' }, totalFees: { $sum: '$fee' } } },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalTrades,
        totalVolume: volumeAgg[0]?.totalVolume || 0,
        totalFees: volumeAgg[0]?.totalFees || 0,
      },
      recentTrades,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};

// PATCH /api/admin/users/:id/role - toggle admin role
const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role.' });
  }
};

// GET /api/admin/analytics - extended platform analytics
const getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTrades,
      totalRecharges,
      planCounts,
      volumeAgg,
      rechargeAgg,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Trade.countDocuments(),
      Recharge.countDocuments({ status: 'completed' }),
      // Count users per plan
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),
      // Trade volume and fees
      Trade.aggregate([
        { $group: { _id: null, totalVolume: { $sum: '$totalUsdt' }, totalFees: { $sum: '$fee' } } },
      ]),
      // Recharge totals
      Recharge.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, totalBonus: { $sum: '$bonus' } } },
      ]),
      // Most recent users
      User.find({ role: 'user' }).select('username email plan createdAt demo_balance')
        .sort({ createdAt: -1 }).limit(5),
    ]);

    const planBreakdown = {};
    for (const pc of planCounts) {
      planBreakdown[pc._id || 'none'] = pc.count;
    }

    res.json({
      analytics: {
        totalUsers,
        totalTrades,
        totalRecharges,
        totalVolume: volumeAgg[0]?.totalVolume || 0,
        totalFees: volumeAgg[0]?.totalFees || 0,
        totalRechargeAmount: rechargeAgg[0]?.totalAmount || 0,
        totalBonusPaid: rechargeAgg[0]?.totalBonus || 0,
        planBreakdown,
      },
      recentUsers,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};

// PATCH /api/admin/users/:id/plan - set plan on user
const adjustPlan = async (req, res) => {
  try {
    const { plan, duration } = req.body;
    const validPlans = ['none', 'starter', 'pro', 'vip'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be one of: none, starter, pro, vip.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.plan = plan;
    if (plan === 'none') {
      user.plan_expires_at = null;
    } else {
      const days = parseInt(duration) || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      user.plan_expires_at = expiresAt;
    }

    await user.save();

    res.json({
      message: `Plan updated to ${plan} for user ${user.username}`,
      plan: user.plan,
      planExpiresAt: user.plan_expires_at,
    });
  } catch (error) {
    console.error('adjustPlan error:', error);
    res.status(500).json({ error: 'Failed to adjust plan.' });
  }
};

// PATCH /api/admin/users/:id/kyc — approve or reject KYC
const reviewKyc = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { kycStatus: status },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: `KYC ${status} for ${user.username}`, user });
  } catch {
    res.status(500).json({ error: 'Failed to update KYC.' });
  }
};

// ─── Deposit Addresses (Admin CRUD) ──────────────────────────────────────────

// GET /api/admin/deposit-addresses
const getAdminDepositAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find().sort({ coin: 1, network: 1 });
    res.json({ addresses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deposit addresses.' });
  }
};

// POST /api/admin/deposit-addresses
const addDepositAddress = async (req, res) => {
  try {
    const { coin, network, address, minDeposit, note } = req.body;
    if (!coin || !network || !address) {
      return res.status(400).json({ error: 'coin, network, and address are required.' });
    }
    const existing = await DepositAddress.findOne({ coin: coin.toUpperCase(), network, address });
    if (existing) {
      return res.status(400).json({ error: 'This address already exists for this coin/network.' });
    }
    const newAddr = await DepositAddress.create({
      coin: coin.toUpperCase(),
      network,
      address,
      minDeposit: parseFloat(minDeposit) || 10,
      note: note || '',
    });
    res.status(201).json({ message: 'Deposit address added.', address: newAddr });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add deposit address.' });
  }
};

// PUT /api/admin/deposit-addresses/:id
const updateDepositAddress = async (req, res) => {
  try {
    const { coin, network, address, minDeposit, note, isActive } = req.body;
    const addr = await DepositAddress.findByIdAndUpdate(
      req.params.id,
      {
        ...(coin && { coin: coin.toUpperCase() }),
        ...(network && { network }),
        ...(address && { address }),
        ...(minDeposit !== undefined && { minDeposit: parseFloat(minDeposit) }),
        ...(note !== undefined && { note }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true }
    );
    if (!addr) return res.status(404).json({ error: 'Address not found.' });
    res.json({ message: 'Address updated.', address: addr });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update deposit address.' });
  }
};

// DELETE /api/admin/deposit-addresses/:id
const deleteDepositAddress = async (req, res) => {
  try {
    const addr = await DepositAddress.findByIdAndDelete(req.params.id);
    if (!addr) return res.status(404).json({ error: 'Address not found.' });
    res.json({ message: 'Address deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete deposit address.' });
  }
};

// ─── Deposit Requests (Admin Review) ─────────────────────────────────────────

// GET /api/admin/deposit-requests
const getDepositRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    const filter = status ? { status } : {};

    const [requests, total] = await Promise.all([
      DepositRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email demo_balance'),
      DepositRequest.countDocuments(filter),
    ]);

    res.json({
      requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deposit requests.' });
  }
};

// PATCH /api/admin/deposit-requests/:id/approve
const approveDepositRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const depositReq = await DepositRequest.findById(req.params.id).populate('user');
    if (!depositReq) return res.status(404).json({ error: 'Deposit request not found.' });
    if (depositReq.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been reviewed.' });
    }

    // Credit user balance
    const user = await User.findById(depositReq.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const balanceBefore = user.demo_balance;
    user.demo_balance = (user.demo_balance || 0) + depositReq.amount;
    user.total_recharged = (user.total_recharged || 0) + depositReq.amount;
    await user.save();

    // Update request status
    depositReq.status = 'approved';
    depositReq.adminNote = adminNote || '';
    depositReq.reviewedAt = new Date();
    depositReq.reviewedBy = req.user._id;
    await depositReq.save();

    // Log transaction
    await Transaction.create({
      user: user._id,
      type: 'deposit',
      coin: depositReq.coin,
      amount: depositReq.amount,
      usdValue: depositReq.amount,
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: `Deposit approved: ${depositReq.amount} ${depositReq.coin} via ${depositReq.network}`,
    });

    // Also save to Recharge history
    await Recharge.create({
      user: user._id,
      amount: depositReq.amount,
      bonus: 0,
      plan: user.plan || 'none',
      status: 'completed',
    });

    res.json({
      message: `Deposit of ${depositReq.amount} ${depositReq.coin} approved. User balance updated.`,
      newBalance: user.demo_balance,
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit.' });
  }
};

// PATCH /api/admin/deposit-requests/:id/reject
const rejectDepositRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const depositReq = await DepositRequest.findById(req.params.id);
    if (!depositReq) return res.status(404).json({ error: 'Deposit request not found.' });
    if (depositReq.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been reviewed.' });
    }

    depositReq.status = 'rejected';
    depositReq.adminNote = adminNote || '';
    depositReq.reviewedAt = new Date();
    depositReq.reviewedBy = req.user._id;
    await depositReq.save();

    res.json({ message: 'Deposit request rejected.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject deposit.' });
  }
};

// GET /api/admin/plan-purchases
const getPlanPurchases = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip  = (page - 1) * limit;

    const [purchases, total, revenueAgg] = await Promise.all([
      PlanPurchase.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email'),
      PlanPurchase.countDocuments(),
      PlanPurchase.aggregate([{ $group: { _id: null, total: { $sum: '$price' } } }]),
    ]);

    res.json({
      purchases,
      totalRevenue: revenueAgg[0]?.total || 0,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('getPlanPurchases error:', error);
    res.status(500).json({ error: 'Failed to fetch plan purchases.' });
  }
};

// PATCH /api/admin/users/:id/ban — ban or unban a user
const banUser = async (req, res) => {
  try {
    const { ban, reason } = req.body; // ban: true/false
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot ban an admin' });

    user.isBanned  = !!ban;
    user.banReason = ban ? (reason || 'Banned by admin') : '';
    user.bannedAt  = ban ? new Date() : null;
    await user.save();

    res.json({ message: ban ? 'User banned' : 'User unbanned', isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/admin/users/:id/trademode — set per-user trade result mode
const setTradeMode = async (req, res) => {
  try {
    const { tradeMode, tradeWinRates } = req.body;
    if (!['win', 'loss'].includes(tradeMode)) {
      return res.status(400).json({ error: 'tradeMode must be win or loss' });
    }
    const update = { tradeMode };
    if (tradeWinRates) update.tradeWinRates = tradeWinRates;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `Trade mode set to ${tradeMode}`, tradeMode: user.tradeMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/withdraw-requests
const getWithdrawRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';
    const filter = status ? { status } : {};
    const [requests, total] = await Promise.all([
      WithdrawRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email demo_balance'),
      WithdrawRequest.countDocuments(filter),
    ]);
    res.json({ requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch withdraw requests.' });
  }
};

// PATCH /api/admin/withdraw-requests/:id/approve
// Balance already deducted at submit time — just mark as approved
const approveWithdrawRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const wReq = await WithdrawRequest.findById(req.params.id);
    if (!wReq) return res.status(404).json({ error: 'Request not found.' });
    if (wReq.status !== 'pending') return res.status(400).json({ error: 'Already reviewed.' });

    wReq.status = 'approved';
    wReq.adminNote = adminNote || '';
    wReq.reviewedAt = new Date();
    wReq.reviewedBy = req.user._id;
    await wReq.save();

    res.json({ message: `Withdrawal of $${wReq.amount} approved.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve withdrawal.' });
  }
};

// PATCH /api/admin/withdraw-requests/:id/reject
// Refund balance since it was deducted at submit time
const rejectWithdrawRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const wReq = await WithdrawRequest.findById(req.params.id);
    if (!wReq) return res.status(404).json({ error: 'Request not found.' });
    if (wReq.status !== 'pending') return res.status(400).json({ error: 'Already reviewed.' });

    // Refund user balance
    const user = await User.findById(wReq.user);
    if (user) {
      const balanceBefore = user.demo_balance;
      user.demo_balance = parseFloat((user.demo_balance + wReq.amount).toFixed(2));
      await user.save();

      await Transaction.create({
        user: user._id,
        type: 'admin_credit',
        coin: 'USDT',
        amount: wReq.amount,
        usdValue: wReq.amount,
        balanceBefore,
        balanceAfter: user.demo_balance,
        description: `Withdrawal rejected — $${wReq.amount} refunded`,
      });
    }

    wReq.status = 'rejected';
    wReq.adminNote = adminNote || '';
    wReq.reviewedAt = new Date();
    wReq.reviewedBy = req.user._id;
    await wReq.save();

    res.json({ message: `Withdrawal rejected. $${wReq.amount} refunded to user.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject withdrawal.' });
  }
};

module.exports = {
  getAllUsers, getAllTrades, modifyBalance, getStats, setUserRole, getAnalytics, adjustPlan, reviewKyc,
  getAdminDepositAddresses, addDepositAddress, updateDepositAddress, deleteDepositAddress,
  getDepositRequests, approveDepositRequest, rejectDepositRequest,
  getWithdrawRequests, approveWithdrawRequest, rejectWithdrawRequest,
  getPlanPurchases, banUser, setTradeMode,
};
