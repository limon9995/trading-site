const express = require('express');
const { getPriceData, getCandles } = require('../controllers/marketController');

const router = express.Router();

router.get('/prices', getPriceData);
router.get('/candles/:symbol', getCandles);

module.exports = router;
