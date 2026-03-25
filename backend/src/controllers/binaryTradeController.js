const { validationResult } = require('express-validator');
const BinaryTrade = require('../models/BinaryTrade');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getCoinPrice } = require('../utils/priceService');

const ALLOWED_DURATIONS = [30, 60, 300];
const DEFAULT_PAYOUT_RATE = 0.85;

let settlementTimer = null;
let settlementInProgress = false;

const settleTrade = async (trade) => {
  if (trade.status !== 'active' || new Date(trade.expiresAt) > new Date()) return trade;

  const priceData = await getCoinPrice(trade.coin);
  if (!priceData) throw new Error(`Unable to settle ${trade.coin} trade`);

  const user = await User.findById(trade.user);
  if (!user) throw new Error('Binary trade user not found');

  const closePrice = priceData.price;
  const isWin = trade.direction === 'up'
    ? closePrice > trade.entryPrice
    : closePrice < trade.entryPrice;
  const profit = isWin
    ? parseFloat((trade.amount * trade.payoutRate).toFixed(2))
    : parseFloat((-trade.amount).toFixed(2));
  const payout = isWin ? parseFloat((trade.amount + profit).toFixed(2)) : 0;
  const balanceBefore = user.demo_balance || 0;

  if (isWin) user.demo_balance = balanceBefore + payout;
  user.totalPnl = (user.totalPnl || 0) + profit;
  await user.save();

  trade.closePrice = closePrice;
  trade.status = isWin ? 'won' : 'lost';
  trade.profit = profit;
  await trade.save();

  await Transaction.create({
    user: user._id,
    type: isWin ? 'binary_win' : 'binary_loss',
    coin: trade.coin,
    amount: trade.amount,
    usdValue: isWin ? payout : trade.amount,
    balanceBefore,
    balanceAfter: user.demo_balance,
    description: isWin
      ? `Binary ${trade.direction.toUpperCase()} won on ${trade.coin} | Profit $${profit.toFixed(2)}`
      : `Binary ${trade.direction.toUpperCase()} lost on ${trade.coin}`,
  });

  return trade;
};

const settleExpiredBinaryTrades = async (userId = null) => {
  if (settlementInProgress && !userId) return;

  try {
    if (!userId) settlementInProgress = true;

    const query = { status: 'active', expiresAt: { $lte: new Date() } };
    if (userId) query.user = userId;

    const expiredTrades = await BinaryTrade.find(query).sort({ expiresAt: 1 }).limit(100);
    for (const trade of expiredTrades) {
      await settleTrade(trade);
    }
  } catch (error) {
    console.error('Binary settlement error:', error.message);
  } finally {
    if (!userId) settlementInProgress = false;
  }
};

const startBinaryTradeSettlementJob = () => {
  if (settlementTimer) return settlementTimer;
  settlementTimer = setInterval(() => {
    settleExpiredBinaryTrades().catch((error) => {
      console.error('Binary settlement loop error:', error.message);
    });
  }, 5000);
  return settlementTimer;
};

const placeBinaryTrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { symbol, direction, amount, duration } = req.body;
    const upperSymbol = symbol.toUpperCase();
    const normalizedDirection = direction.toLowerCase();
    const parsedAmount = parseFloat(amount);
    const parsedDuration = parseInt(duration, 10);

    if (!['up', 'down'].includes(normalizedDirection)) {
      return res.status(400).json({ error: 'Direction must be UP or DOWN.' });
    }
    if (!ALLOWED_DURATIONS.includes(parsedDuration)) {
      return res.status(400).json({ error: 'Duration must be 30s, 60s, or 300s.' });
    }

    const priceData = await getCoinPrice(upperSymbol);
    if (!priceData) return res.status(400).json({ error: `Coin ${upperSymbol} not supported.` });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (parsedAmount < 1) return res.status(400).json({ error: 'Minimum binary trade amount is $1 USDT.' });
    if ((user.demo_balance || 0) < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient USDT balance.' });
    }

    const balanceBefore = user.demo_balance;
    user.demo_balance -= parsedAmount;
    user.totalTraded = (user.totalTraded || 0) + parsedAmount;
    await user.save();

    const expiresAt = new Date(Date.now() + parsedDuration * 1000);
    const trade = await BinaryTrade.create({
      user: user._id,
      coin: upperSymbol,
      direction: normalizedDirection,
      amount: parsedAmount,
      entryPrice: priceData.price,
      duration: parsedDuration,
      expiresAt,
      payoutRate: DEFAULT_PAYOUT_RATE,
    });

    await Transaction.create({
      user: user._id,
      type: 'binary_open',
      coin: upperSymbol,
      amount: parsedAmount,
      usdValue: parsedAmount,
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: `Opened binary ${normalizedDirection.toUpperCase()} on ${upperSymbol} for ${parsedDuration}s`,
    });

    res.status(201).json({
      message: `Binary ${normalizedDirection.toUpperCase()} trade opened for ${upperSymbol}`,
      trade,
      newBalance: user.demo_balance,
    });
  } catch (error) {
    console.error('Place binary trade error:', error);
    res.status(500).json({ error: 'Failed to place binary trade.' });
  }
};

const getBinaryTradeHistory = async (req, res) => {
  try {
    await settleExpiredBinaryTrades(req.user._id);

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const trades = await BinaryTrade.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(limit);

    res.json({
      activeTrades: trades.filter((trade) => trade.status === 'active'),
      history: trades.filter((trade) => trade.status !== 'active'),
      payoutRate: DEFAULT_PAYOUT_RATE,
      allowedDurations: ALLOWED_DURATIONS,
    });
  } catch (error) {
    console.error('Get binary trade history error:', error);
    res.status(500).json({ error: 'Failed to load binary trade history.' });
  }
};

module.exports = {
  ALLOWED_DURATIONS,
  DEFAULT_PAYOUT_RATE,
  getBinaryTradeHistory,
  placeBinaryTrade,
  settleExpiredBinaryTrades,
  startBinaryTradeSettlementJob,
};
