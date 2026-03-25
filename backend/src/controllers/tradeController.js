const User = require('../models/User');
const Trade = require('../models/Trade');
const Transaction = require('../models/Transaction');
const { getCoinPrice } = require('../utils/priceService');
const { validationResult } = require('express-validator');

const FEE_RATE = 0.001; // 0.1% trading fee
const REFERRAL_COMMISSION_RATE = 0.05; // referrer earns 5% of the fee paid by referred user

// POST /api/trade/buy
const executeBuy = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { symbol, usdtAmount } = req.body;
    const upperSymbol = symbol.toUpperCase();

    // Get current price from Binance API
    const priceData = await getCoinPrice(upperSymbol);
    if (!priceData) {
      return res.status(400).json({ error: `Coin ${upperSymbol} not supported.` });
    }

    const user = await User.findById(req.user._id);
    const amount = parseFloat(usdtAmount);

    // Minimum trade size check
    if (amount < 1) {
      return res.status(400).json({ error: 'Minimum trade amount is $1 USDT.' });
    }

    // Check sufficient USDT balance
    if (user.demo_balance < amount) {
      return res.status(400).json({ error: 'Insufficient USDT balance.' });
    }

    // Fee calculation: fee = 0.1% of total USDT spent
    const fee = parseFloat((amount * FEE_RATE).toFixed(8));
    const netUsdt = amount - fee; // USDT after fee deducted
    const coinAmount = netUsdt / priceData.price; // coins received after fee

    const balanceBefore = user.demo_balance;

    // Deduct full amount (including fee) from USDT balance
    user.demo_balance -= amount;
    user.totalTraded += amount;

    // Update holdings with weighted average buy price
    const existingHolding = user.holdings.get(upperSymbol) || { amount: 0, avgBuyPrice: 0 };
    const newTotalAmount = existingHolding.amount + coinAmount;
    const newAvgPrice = newTotalAmount > 0
      ? (existingHolding.amount * existingHolding.avgBuyPrice + coinAmount * priceData.price) / newTotalAmount
      : priceData.price;

    user.holdings.set(upperSymbol, {
      amount: newTotalAmount,
      avgBuyPrice: newAvgPrice,
    });

    // Also track BTC/ETH in dedicated balance fields for quick access
    if (upperSymbol === 'BTC') {
      user.btc_balance = (user.btc_balance || 0) + coinAmount;
    } else if (upperSymbol === 'ETH') {
      user.eth_balance = (user.eth_balance || 0) + coinAmount;
    }

    await user.save();

    // Create trade record with fee
    const trade = await Trade.create({
      user: user._id,
      coin: upperSymbol,
      coinId: priceData.coinId,
      type: 'buy',
      coinAmount,
      pricePerCoin: priceData.price,
      totalUsdt: amount,
      fee,
    });

    // Log transaction
    await Transaction.create({
      user: user._id,
      type: 'trade_buy',
      coin: upperSymbol,
      amount: coinAmount,
      usdValue: amount,
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: `Bought ${coinAmount.toFixed(6)} ${upperSymbol} @ $${priceData.price.toLocaleString()} | Fee: $${fee.toFixed(4)}`,
      trade: trade._id,
    });

    // Referral commission — pay referrer 5% of the fee this user paid
    if (user.referredBy) {
      const commission = parseFloat((fee * REFERRAL_COMMISSION_RATE).toFixed(8));
      if (commission > 0) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          referrer.demo_balance = parseFloat((referrer.demo_balance + commission).toFixed(8));
          referrer.referralEarnings = parseFloat(((referrer.referralEarnings || 0) + commission).toFixed(8));
          await referrer.save();
          await Transaction.create({
            user: referrer._id,
            type: 'referral_bonus',
            coin: 'USDT',
            amount: commission,
            usdValue: commission,
            balanceBefore: referrer.demo_balance - commission,
            balanceAfter: referrer.demo_balance,
            description: `Referral commission: ${user.username} bought ${upperSymbol} — earned $${commission.toFixed(4)} USDT`,
          });
        }
      }
    }

    res.json({
      message: `Successfully bought ${coinAmount.toFixed(6)} ${upperSymbol}`,
      trade: {
        symbol: upperSymbol,
        coinAmount,
        pricePerCoin: priceData.price,
        totalUsdt: amount,
        fee,
        netUsdt,
        type: 'buy',
      },
      newBalance: user.demo_balance,
    });
  } catch (error) {
    console.error('Buy error:', error);
    res.status(500).json({ error: 'Trade execution failed.' });
  }
};

// POST /api/trade/sell
const executeSell = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { symbol, coinAmount } = req.body;
    const upperSymbol = symbol.toUpperCase();

    const priceData = await getCoinPrice(upperSymbol);
    if (!priceData) {
      return res.status(400).json({ error: `Coin ${upperSymbol} not supported.` });
    }

    const user = await User.findById(req.user._id);
    const amount = parseFloat(coinAmount);

    if (amount <= 0) {
      return res.status(400).json({ error: 'Sell amount must be positive.' });
    }

    const holding = user.holdings.get(upperSymbol);
    if (!holding || holding.amount < amount) {
      return res.status(400).json({ error: `Insufficient ${upperSymbol} balance.` });
    }

    // Fee calculation: fee = 0.1% of gross USDT received
    const grossUsdt = amount * priceData.price;
    const fee = parseFloat((grossUsdt * FEE_RATE).toFixed(8));
    const netUsdt = grossUsdt - fee; // USDT after fee deducted

    const avgBuyPrice = holding.avgBuyPrice;
    // PnL calculated on gross amount minus cost basis
    const pnl = (priceData.price - avgBuyPrice) * amount - fee;
    const balanceBefore = user.demo_balance;

    // Add net USDT (after fee) to balance
    user.demo_balance += netUsdt;
    user.totalTraded += grossUsdt;
    user.totalPnl += pnl;

    // Update holdings
    const newAmount = holding.amount - amount;
    if (newAmount < 0.000001) {
      user.holdings.delete(upperSymbol); // Remove dust holdings
      // Also clear dedicated balance fields
      if (upperSymbol === 'BTC') user.btc_balance = 0;
      if (upperSymbol === 'ETH') user.eth_balance = 0;
    } else {
      user.holdings.set(upperSymbol, { amount: newAmount, avgBuyPrice: holding.avgBuyPrice });
      if (upperSymbol === 'BTC') user.btc_balance = newAmount;
      if (upperSymbol === 'ETH') user.eth_balance = newAmount;
    }

    await user.save();

    const trade = await Trade.create({
      user: user._id,
      coin: upperSymbol,
      coinId: priceData.coinId,
      type: 'sell',
      coinAmount: amount,
      pricePerCoin: priceData.price,
      totalUsdt: grossUsdt,
      fee,
      pnl,
      avgBuyPrice,
    });

    await Transaction.create({
      user: user._id,
      type: 'trade_sell',
      coin: upperSymbol,
      amount,
      usdValue: grossUsdt,
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: `Sold ${amount.toFixed(6)} ${upperSymbol} @ $${priceData.price.toLocaleString()} | Fee: $${fee.toFixed(4)} | PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
      trade: trade._id,
    });

    // Referral commission — pay referrer 5% of the fee this user paid
    if (user.referredBy) {
      const commission = parseFloat((fee * REFERRAL_COMMISSION_RATE).toFixed(8));
      if (commission > 0) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          referrer.demo_balance = parseFloat((referrer.demo_balance + commission).toFixed(8));
          referrer.referralEarnings = parseFloat(((referrer.referralEarnings || 0) + commission).toFixed(8));
          await referrer.save();
          await Transaction.create({
            user: referrer._id,
            type: 'referral_bonus',
            coin: 'USDT',
            amount: commission,
            usdValue: commission,
            balanceBefore: referrer.demo_balance - commission,
            balanceAfter: referrer.demo_balance,
            description: `Referral commission: ${user.username} sold ${upperSymbol} — earned $${commission.toFixed(4)} USDT`,
          });
        }
      }
    }

    res.json({
      message: `Successfully sold ${amount.toFixed(6)} ${upperSymbol}`,
      trade: {
        symbol: upperSymbol,
        coinAmount: amount,
        pricePerCoin: priceData.price,
        grossUsdt,
        fee,
        netUsdt,
        pnl,
        type: 'sell',
      },
      newBalance: user.demo_balance,
    });
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ error: 'Trade execution failed.' });
  }
};

// GET /api/trade/history
const getTradeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [trades, total] = await Promise.all([
      Trade.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Trade.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      trades,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade history.' });
  }
};

module.exports = { executeBuy, executeSell, getTradeHistory };
