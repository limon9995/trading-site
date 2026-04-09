const DepositAddress = require('../models/DepositAddress');
const DepositRequest = require('../models/DepositRequest');

// GET /api/deposit/addresses
// Returns all active deposit addresses grouped by coin
const getDepositAddresses = async (req, res) => {
  try {
    const addresses = await DepositAddress.find({ isActive: true }).sort({ coin: 1, network: 1 });

    // Group by coin
    const grouped = {};
    for (const addr of addresses) {
      if (!grouped[addr.coin]) grouped[addr.coin] = [];
      grouped[addr.coin].push({
        _id: addr._id,
        network: addr.network,
        address: addr.address,
        minDeposit: addr.minDeposit,
        note: addr.note,
      });
    }

    // Sort USDT networks so TRC20 is first
    if (grouped['USDT']) {
      grouped['USDT'].sort((a, b) => {
        if (a.network === 'TRC20') return -1;
        if (b.network === 'TRC20') return 1;
        return 0;
      });
    }

    // Build final object with USDT first
    const ordered = {};
    if (grouped['USDT']) ordered['USDT'] = grouped['USDT'];
    for (const coin of Object.keys(grouped)) {
      if (coin !== 'USDT') ordered[coin] = grouped[coin];
    }

    res.json({ addresses: ordered });
  } catch (error) {
    console.error('Get deposit addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit addresses.' });
  }
};

// POST /api/deposit/submit
// User submits a deposit request after uploading voucher
const submitDepositRequest = async (req, res) => {
  try {
    const { coin, network, depositAddress, amount, txHash } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment voucher image is required.' });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount.' });
    }

    // Verify the address exists and is active
    const addrRecord = await DepositAddress.findOne({
      coin: coin.toUpperCase(),
      network,
      address: depositAddress,
      isActive: true,
    });
    if (!addrRecord) {
      return res.status(400).json({ error: 'Invalid deposit address.' });
    }

    const voucherPath = `/uploads/vouchers/${req.file.filename}`;

    const depositRequest = await DepositRequest.create({
      user: req.user._id,
      coin: coin.toUpperCase(),
      network,
      depositAddress,
      amount: parsedAmount,
      voucherImage: voucherPath,
      txHash: txHash || '',
    });

    res.status(201).json({
      message: 'Deposit request submitted successfully. Waiting for admin review.',
      request: depositRequest,
    });
  } catch (error) {
    console.error('Submit deposit error:', error);
    res.status(500).json({ error: 'Failed to submit deposit request.' });
  }
};

// GET /api/deposit/history
// User's deposit request history
const getDepositHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      DepositRequest.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DepositRequest.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Deposit history error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit history.' });
  }
};

module.exports = { getDepositAddresses, submitDepositRequest, getDepositHistory };
