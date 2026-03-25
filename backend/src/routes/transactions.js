const express = require('express');
const { getTransactions } = require('../controllers/transactionController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getTransactions);

module.exports = router;
