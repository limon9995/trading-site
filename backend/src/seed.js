require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Plan = require('./models/Plan');
const Trade = require('./models/Trade');
const Transaction = require('./models/Transaction');
const Recharge = require('./models/Recharge');

const PLANS = [
  {
    name: 'level1',
    level: 1,
    displayName: 'Starter',
    price: 100,
    dailyReturn: 1.0,
    duration: 30,
    maxReturn: 30,
    features: [
      'Daily returns of 1.0%',
      '30-day duration',
      'Up to 30% total return',
      'Basic support',
      'Trade fee discount 10%',
    ],
    isActive: true,
  },
  {
    name: 'level2',
    level: 2,
    displayName: 'Pro',
    price: 500,
    dailyReturn: 1.5,
    duration: 60,
    maxReturn: 90,
    features: [
      'Daily returns of 1.5%',
      '60-day duration',
      'Up to 90% total return',
      'Priority support',
      'Trade fee discount 20%',
      'Advanced analytics',
    ],
    isActive: true,
  },
  {
    name: 'level3',
    level: 3,
    displayName: 'VIP',
    price: 2000,
    dailyReturn: 2.0,
    duration: 90,
    maxReturn: 180,
    features: [
      'Daily returns of 2.0%',
      '90-day duration',
      'Up to 180% total return',
      '24/7 VIP support',
      'Trade fee discount 50%',
      'Exclusive market insights',
      'Dedicated account manager',
    ],
    isActive: true,
  },
  {
    name: 'level4',
    level: 4,
    displayName: 'Elite',
    price: 5000,
    dailyReturn: 2.5,
    duration: 120,
    maxReturn: 300,
    features: [
      'Daily returns of 2.5%',
      '120-day duration',
      'Up to 300% total return',
      'Elite 24/7 support',
      'Trade fee discount 75%',
      'Exclusive market insights',
      'Dedicated account manager',
      'Early access to new features',
    ],
    isActive: true,
  },
];

const DEMO_USERS = [
  {
    username: 'alice_trader',
    email: 'alice@example.com',
    password: 'Password123!',
    role: 'user',
    demo_balance: 8500,
    plan: 'level2',
  },
  {
    username: 'bob_crypto',
    email: 'bob@example.com',
    password: 'Password123!',
    role: 'user',
    demo_balance: 15000,
    plan: 'level3',
  },
  {
    username: 'carol_invest',
    email: 'carol@example.com',
    password: 'Password123!',
    role: 'user',
    demo_balance: 12000,
    plan: 'level1',
  },
];

const SAMPLE_PRICES = {
  BTC: 84000,
  ETH: 1600,
  BNB: 590,
  SOL: 130,
};

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // ── Clear existing seed data ─────────────────────────────────────
    await Plan.deleteMany({});
    console.log('Cleared plans');

    // ── Seed Plans ───────────────────────────────────────────────────
    const plans = await Plan.insertMany(PLANS);
    console.log(`Seeded ${plans.length} plans`);

    // ── Seed Demo Users ──────────────────────────────────────────────
    const createdUsers = [];
    for (const userData of DEMO_USERS) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User ${userData.email} already exists, skipping`);
        createdUsers.push(existing);
        continue;
      }

      // Set plan expiry
      const planExpiry = new Date();
      planExpiry.setDate(planExpiry.getDate() + 30);

      const user = new User({
        ...userData,
        plan_expires_at: planExpiry,
        total_recharged: userData.demo_balance * 0.8,
        totalTraded: userData.demo_balance * 0.5,
      });
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.username} (${user.email})`);
    }

    // ── Seed Sample Trades ───────────────────────────────────────────
    for (const user of createdUsers) {
      const tradeCount = await Trade.countDocuments({ user: user._id });
      if (tradeCount > 0) {
        console.log(`User ${user.username} already has trades, skipping`);
        continue;
      }

      const sampleTrades = [
        {
          coin: 'BTC',
          coinId: 'bitcoin',
          type: 'buy',
          coinAmount: 0.05,
          pricePerCoin: SAMPLE_PRICES.BTC,
          totalUsdt: 0.05 * SAMPLE_PRICES.BTC,
          fee: 0.05 * SAMPLE_PRICES.BTC * 0.001,
        },
        {
          coin: 'ETH',
          coinId: 'ethereum',
          type: 'buy',
          coinAmount: 2.0,
          pricePerCoin: SAMPLE_PRICES.ETH,
          totalUsdt: 2.0 * SAMPLE_PRICES.ETH,
          fee: 2.0 * SAMPLE_PRICES.ETH * 0.001,
        },
        {
          coin: 'SOL',
          coinId: 'solana',
          type: 'buy',
          coinAmount: 10,
          pricePerCoin: SAMPLE_PRICES.SOL,
          totalUsdt: 10 * SAMPLE_PRICES.SOL,
          fee: 10 * SAMPLE_PRICES.SOL * 0.001,
        },
        {
          coin: 'BTC',
          coinId: 'bitcoin',
          type: 'sell',
          coinAmount: 0.02,
          pricePerCoin: SAMPLE_PRICES.BTC * 1.05,
          totalUsdt: 0.02 * SAMPLE_PRICES.BTC * 1.05,
          fee: 0.02 * SAMPLE_PRICES.BTC * 1.05 * 0.001,
          pnl: 0.02 * (SAMPLE_PRICES.BTC * 1.05 - SAMPLE_PRICES.BTC),
          avgBuyPrice: SAMPLE_PRICES.BTC,
        },
      ];

      // Set holdings for the user
      user.holdings.set('BTC', { amount: 0.03, avgBuyPrice: SAMPLE_PRICES.BTC });
      user.holdings.set('ETH', { amount: 2.0, avgBuyPrice: SAMPLE_PRICES.ETH });
      user.holdings.set('SOL', { amount: 10, avgBuyPrice: SAMPLE_PRICES.SOL });
      await user.save();

      for (const tradeData of sampleTrades) {
        const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        await Trade.create({ user: user._id, ...tradeData, status: 'completed', createdAt });
      }

      // Seed recharge history
      await Recharge.create({
        user: user._id,
        amount: 5000,
        bonus: 250,
        plan: user.plan,
        status: 'completed',
      });

      console.log(`Seeded ${sampleTrades.length} trades and 1 recharge for ${user.username}`);
    }

    console.log('\nSeed completed successfully!');
    console.log('\nDemo accounts:');
    DEMO_USERS.forEach(u => {
      console.log(`  ${u.username} | ${u.email} | Password: ${u.password} | Plan: ${u.plan}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
