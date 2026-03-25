const express = require('express');
const auth = require('../middleware/auth');
const { openTrade, closeTrade, getOpenTrades, getHistory } = require('../controllers/forexController');

const router = express.Router();

router.post('/open',          auth, openTrade);
router.post('/close/:id',     auth, closeTrade);
router.get('/open',           auth, getOpenTrades);
router.get('/history',        auth, getHistory);

module.exports = router;
