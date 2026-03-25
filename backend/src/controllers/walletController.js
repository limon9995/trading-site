const User = require('../models/User');
const Plan = require('../models/Plan');
const { getPrices } = require('../utils/priceService');

// GET /api/wallet
// Returns full wallet: balances, holdings with P&L, portfolio stats, plan info
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const prices = await getPrices();

    // Build holdings array with real-time P&L
    const holdingsArray = [];
    let totalHoldingsValue = 0;

    for (const [symbol, holding] of user.holdings.entries()) {
      if (holding.amount > 0) {
        const priceData = prices[symbol];
        const currentPrice = priceData?.price || 0;
        const currentValue = holding.amount * currentPrice;
        const costBasis = holding.amount * (holding.avgBuyPrice || 0);
        const pnl = currentValue - costBasis;
        const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

        holdingsArray.push({
          symbol,
          coinId: priceData?.coinId,
          amount: holding.amount,
          avgBuyPrice: holding.avgBuyPrice || 0,
          currentPrice,
          currentValue,
          costBasis,
          pnl,
          pnlPercent,
          change24h: priceData?.change24h || 0,
        });

        totalHoldingsValue += currentValue;
      }
    }

    // BTC and ETH specific USD values
    const btcPrice = prices['BTC']?.price || 0;
    const ethPrice = prices['ETH']?.price || 0;
    const btcUsdValue = (user.btc_balance || 0) * btcPrice;
    const ethUsdValue = (user.eth_balance || 0) * ethPrice;

    const usdtBalance = user.demo_balance || 0;
    const btcBalance = user.btc_balance || 0;
    const ethBalance = user.eth_balance || 0;
    const bonusBalance = user.bonus_balance || 0;

    const totalBalance = usdtBalance + totalHoldingsValue;
    const initialBalance = parseFloat(process.env.DEFAULT_BALANCE || '10000');
    const totalPnl = (user.totalPnl || 0);
    const totalPnlPercent = initialBalance > 0 ? ((totalBalance - initialBalance) / initialBalance) * 100 : 0;

    // Fetch current plan details if user has one
    let planDetails = null;
    let planIsActive = false;
    if (user.plan && user.plan !== 'none') {
      planDetails = await Plan.findOne({ name: user.plan }).lean();
      const isExpired = user.plan_expires_at && new Date() > new Date(user.plan_expires_at);
      planIsActive = !!planDetails && !isExpired;
    }

    res.json({
      // USDT balance (main trading balance)
      usdtBalance,
      // Named aliases
      btcBalance,
      ethBalance,
      bonusBalance,
      // USD values of BTC/ETH
      btcUsdValue,
      ethUsdValue,
      // Portfolio
      holdingsValue: totalHoldingsValue,
      totalBalance,
      totalPnl,
      totalPnlPercent,
      holdings: holdingsArray,
      // Recharge stats
      totalRecharged: user.total_recharged || 0,
      // Referral
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      referralEarnings: user.referralEarnings || 0,
      // Plan info
      plan: user.plan || 'none',
      planExpiresAt: user.plan_expires_at,
      planDetails,
      planIsActive,
    });
  } catch (error) {
    console.error('Wallet error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet data.' });
  }
};

module.exports = { getWallet };
