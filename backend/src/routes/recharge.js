const express = require('express');
const { body } = require('express-validator');
const { recharge, getRechargeHistory } = require('../controllers/rechargeController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/recharge - add funds to balance
router.post('/', auth, [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum recharge amount is $10'),
], recharge);

// GET /api/recharge/history - paginated recharge history
router.get('/history', auth, getRechargeHistory);

module.exports = router;
