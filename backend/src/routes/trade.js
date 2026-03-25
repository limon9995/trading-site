const express = require('express');
const { body } = require('express-validator');
const { executeBuy, executeSell, getTradeHistory } = require('../controllers/tradeController');
const auth = require('../middleware/auth');
const { tradeLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const tradeValidation = [
  body('symbol').notEmpty().withMessage('Symbol is required'),
];

const buyValidation = [
  ...tradeValidation,
  body('usdtAmount').isFloat({ min: 1 }).withMessage('USDT amount must be at least 1'),
];

const sellValidation = [
  ...tradeValidation,
  body('coinAmount').isFloat({ min: 0 }).withMessage('Coin amount must be positive'),
];

router.post('/buy', auth, tradeLimiter, buyValidation, executeBuy);
router.post('/sell', auth, tradeLimiter, sellValidation, executeSell);
router.get('/history', auth, getTradeHistory);

module.exports = router;
