const ForexTrade     = require('../models/ForexTrade');
const User           = require('../models/User');
const BinarySettings = require('../models/BinarySettings');
const { getCoinPrice } = require('../utils/priceService');

// Get global win rates fallback
async function getGlobalWinRates() {
  const s = await BinarySettings.findOne().lean();
  return s?.forceWinRates || { '20': 0.10, '30': 0.20, '60': 0.30, '90': 0.50, '180': 0.70 };
}

// ── Open a new position ──────────────────────────────────────────────────────
const openTrade = async (req, res) => {
  try {
    const { coin, type, amount, leverage = 1, stopLoss, takeProfit } = req.body;
    const userId = req.user.id;

    if (!coin || !type || !amount) return res.status(400).json({ error: 'coin, type and amount are required' });
    if (!['buy', 'sell'].includes(type)) return res.status(400).json({ error: 'type must be buy or sell' });

    const lev = Math.min(Math.max(parseInt(leverage) || 1, 1), 100);
    const amt = parseFloat(amount);
    if (amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const balance = user.demo_balance || 0;
    if (amt > balance) return res.status(400).json({ error: 'Insufficient balance' });

    const priceData = await getCoinPrice(coin);
    if (!priceData) return res.status(400).json({ error: 'Could not get price for ' + coin });

    const entryPrice  = priceData.price;
    const positionSize = amt * lev;

    // Deduct margin from balance
    user.demo_balance = parseFloat((balance - amt).toFixed(8));
    await user.save();

    const trade = await ForexTrade.create({
      user: userId,
      coin: coin.toUpperCase(),
      type,
      amount: amt,
      leverage: lev,
      positionSize,
      entryPrice,
      stopLoss:    stopLoss    ? parseFloat(stopLoss)    : null,
      takeProfit:  takeProfit  ? parseFloat(takeProfit)  : null,
    });

    res.json({ message: 'Position opened', trade });
  } catch (err) {
    console.error('openTrade error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── Close a position manually ────────────────────────────────────────────────
const closeTrade = async (req, res) => {
  try {
    const trade = await ForexTrade.findOne({ _id: req.params.id, user: req.user.id, status: 'open' });
    if (!trade) return res.status(404).json({ error: 'Open trade not found' });

    const priceData = await getCoinPrice(trade.coin);
    const closePrice = priceData?.price || trade.entryPrice;

    await settleTrade(trade, closePrice, 'closed');
    res.json({ message: 'Position closed', trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get open positions ────────────────────────────────────────────────────────
const getOpenTrades = async (req, res) => {
  try {
    const trades = await ForexTrade.find({ user: req.user.id, status: 'open' }).sort({ createdAt: -1 });
    res.json({ trades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get trade history ─────────────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const trades = await ForexTrade
      .find({ user: req.user.id, status: { $in: ['closed', 'liquidated'] } })
      .sort({ closedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ trades });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Internal: settle a trade ──────────────────────────────────────────────────
async function settleTrade(trade, closePrice, status) {
  const priceDiff = closePrice - trade.entryPrice;
  const direction = trade.type === 'buy' ? 1 : -1;
  // P&L = (priceDiff / entryPrice) * positionSize * direction
  const pnl = parseFloat(((priceDiff / trade.entryPrice) * trade.positionSize * direction).toFixed(8));

  // Return margin + pnl (cannot go below 0 for the account)
  const payout = Math.max(0, trade.amount + pnl);

  trade.closePrice = closePrice;
  trade.status     = pnl <= -trade.amount ? 'liquidated' : status;
  trade.pnl        = pnl;
  trade.closedAt   = new Date();
  await trade.save();

  // Credit payout back to user balance
  await User.findByIdAndUpdate(trade.user, { $inc: { demo_balance: payout } });
  return trade;
}

// ── Force-settle a trade (win or loss) without price logic ────────────────────
async function forceSettleTrade(trade, mode, forceRates) {
  let pnl, status;

  if (mode === 'win') {
    // Use binary-style rate keyed by duration if available, else 30%
    const rate = forceRates[String(trade.duration)] ?? 0.30;
    pnl    = parseFloat((trade.amount * rate).toFixed(2));
    status = 'closed';
  } else {
    // Force loss — lose full margin
    pnl    = -trade.amount;
    status = 'liquidated';
  }

  const payout = Math.max(0, trade.amount + pnl);
  trade.closePrice = trade.entryPrice; // no price movement — just admin override
  trade.status     = status;
  trade.pnl        = pnl;
  trade.closedAt   = new Date();
  await trade.save();

  await User.findByIdAndUpdate(trade.user, { $inc: { demo_balance: payout } });
  return trade;
}

// ── Settlement job: check all open forex trades ───────────────────────────────
const startForexSettlementJob = () => {
  setInterval(async () => {
    try {
      const openTrades = await ForexTrade.find({ status: 'open' }).populate('user', 'tradeMode tradeWinRates');
      if (!openTrades.length) return;

      const globalRates = await getGlobalWinRates();

      for (const trade of openTrades) {
        try {
          // ── Per-user mode ─────────────────────────────────────
          const userMode  = trade.user?.tradeMode  || 'loss';
          const userRates = trade.user?.tradeWinRates || globalRates;

          if (userMode === 'win' || userMode === 'loss') {
            await forceSettleTrade(trade, userMode, userRates);
            continue;
          }

          // ── Normal market logic (fallback) ────────────────────
          const priceData = await getCoinPrice(trade.coin);
          if (!priceData) continue;
          const currentPrice = priceData.price;

          const priceDiff = currentPrice - trade.entryPrice;
          const direction = trade.type === 'buy' ? 1 : -1;
          const pnl = (priceDiff / trade.entryPrice) * trade.positionSize * direction;

          if (pnl <= -trade.amount) {
            await settleTrade(trade, currentPrice, 'liquidated'); continue;
          }
          if (trade.takeProfit) {
            const tpHit = trade.type === 'buy' ? currentPrice >= trade.takeProfit : currentPrice <= trade.takeProfit;
            if (tpHit) { await settleTrade(trade, trade.takeProfit, 'closed'); continue; }
          }
          if (trade.stopLoss) {
            const slHit = trade.type === 'buy' ? currentPrice <= trade.stopLoss : currentPrice >= trade.stopLoss;
            if (slHit) { await settleTrade(trade, trade.stopLoss, 'closed'); continue; }
          }
        } catch (innerErr) {
          console.error('Forex settlement error for trade', trade._id, innerErr.message);
        }
      }
    } catch (err) {
      console.error('Forex settlement error:', err.message);
    }
  }, 5000);
  console.log('⚡ Forex trade settlement job started');
};

module.exports = { openTrade, closeTrade, getOpenTrades, getHistory, startForexSettlementJob };
