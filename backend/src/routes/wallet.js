const express = require('express');
const { getWallet } = require('../controllers/walletController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getWallet);

module.exports = router;
