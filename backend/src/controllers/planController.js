const User = require('../models/User');
const Plan = require('../models/Plan');
const Transaction = require('../models/Transaction');
const PlanPurchase = require('../models/PlanPurchase');

// Default plan data (seeded on first request if DB is empty)
const DEFAULT_PLANS = [
  {
    name: 'level1',
    level: 1,
    displayName: 'Starter',
    price: 100,
    dailyReturn: 1.0,
    duration: 30,
    maxReturn: 30,
    tradeBonus: 10,
    withdrawSpeed: 'normal',
    features: [
      'Daily returns of 1.0%',
      '30-day duration',
      'Up to 30% total return',
      'Basic support',
      'Trade fee discount 10%',
    ],
  },
  {
    name: 'level2',
    level: 2,
    displayName: 'Pro',
    price: 500,
    dailyReturn: 1.5,
    duration: 60,
    maxReturn: 90,
    tradeBonus: 20,
    withdrawSpeed: 'fast',
    features: [
      'Daily returns of 1.5%',
      '60-day duration',
      'Up to 90% total return',
      'Priority support',
      'Trade fee discount 20%',
      'Advanced analytics',
    ],
  },
  {
    name: 'level3',
    level: 3,
    displayName: 'VIP',
    price: 2000,
    dailyReturn: 2.0,
    duration: 90,
    maxReturn: 180,
    tradeBonus: 50,
    withdrawSpeed: 'fast',
    features: [
      'Daily returns of 2.0%',
      '90-day duration',
      'Up to 180% total return',
      '24/7 VIP support',
      'Trade fee discount 50%',
      'Exclusive market insights',
      'Dedicated account manager',
    ],
  },
  {
    name: 'level4',
    level: 4,
    displayName: 'Elite',
    price: 5000,
    dailyReturn: 2.5,
    duration: 120,
    maxReturn: 300,
    tradeBonus: 75,
    withdrawSpeed: 'instant',
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
  },
];

// Helper: ensure plans exist in DB
const ensurePlansExist = async () => {
  const count = await Plan.countDocuments();
  if (count === 0) {
    await Plan.insertMany(DEFAULT_PLANS);
  }
};

// GET /api/plans
const getPlans = async (req, res) => {
  try {
    await ensurePlansExist();
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json({ plans });
  } catch (error) {
    console.error('getPlans error:', error);
    res.status(500).json({ error: 'Failed to fetch plans.' });
  }
};

// POST /api/plans/purchase
const purchasePlan = async (req, res) => {
  try {
    const { planName } = req.body;
    if (!planName) {
      return res.status(400).json({ error: 'Plan name is required.' });
    }

    await ensurePlansExist();
    const plan = await Plan.findOne({ name: planName.toLowerCase(), isActive: true });
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found or inactive.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check sufficient USDT balance
    if ((user.demo_balance || 0) < plan.price) {
      return res.status(400).json({ error: `Insufficient USDT balance. You need $${plan.price} USDT.` });
    }

    const balanceBefore = user.demo_balance;

    // Deduct plan price from USDT balance
    user.demo_balance -= plan.price;

    // Set plan on user
    user.plan = plan.name;
    // Plan expires: duration days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration);
    user.plan_expires_at = expiresAt;

    await user.save();

    // Log transaction (debit from user)
    await Transaction.create({
      user: user._id,
      type: 'admin_debit',
      coin: 'USDT',
      amount: plan.price,
      usdValue: plan.price,
      balanceBefore,
      balanceAfter: user.demo_balance,
      description: `Purchased ${plan.displayName} plan - ${plan.dailyReturn}% daily return for ${plan.duration} days`,
    });

    // Record purchase history
    await PlanPurchase.create({
      user: user._id,
      planName:    plan.name,
      displayName: plan.displayName,
      price:       plan.price,
      dailyReturn: plan.dailyReturn,
      duration:    plan.duration,
      expiresAt,
    });

    // Credit admin master wallet (first admin user found)
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      adminUser.demo_balance = (adminUser.demo_balance || 0) + plan.price;
      await adminUser.save();
    }

    res.json({
      message: `Successfully purchased ${plan.displayName} plan!`,
      plan: {
        name: plan.name,
        displayName: plan.displayName,
        dailyReturn: plan.dailyReturn,
        duration: plan.duration,
        expiresAt,
      },
      newBalance: user.demo_balance,
    });
  } catch (error) {
    console.error('purchasePlan error:', error);
    res.status(500).json({ error: 'Failed to purchase plan.' });
  }
};

// GET /api/plans/my
const getMyPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('plan plan_expires_at demo_balance');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let planDetails = null;
    if (user.plan && user.plan !== 'none') {
      planDetails = await Plan.findOne({ name: user.plan });
    }

    // Check if plan is expired
    const isExpired = user.plan_expires_at && new Date() > new Date(user.plan_expires_at);

    res.json({
      currentPlan: user.plan || 'none',
      planDetails,
      expiresAt: user.plan_expires_at,
      isActive: !!planDetails && !isExpired,
      isExpired,
    });
  } catch (error) {
    console.error('getMyPlan error:', error);
    res.status(500).json({ error: 'Failed to fetch plan info.' });
  }
};

module.exports = { getPlans, purchasePlan, getMyPlan };
