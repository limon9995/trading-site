const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/binaryController');
const auth    = require('../middleware/auth');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// Public
router.get('/settings',         ctrl.getPublicSettings);

// User
router.post('/place',           auth, ctrl.placeTrade);
router.get('/active',           auth, ctrl.getActiveTrades);
router.get('/history',          auth, ctrl.getTradeHistory);

// Admin
router.get('/admin/settings',   auth, adminOnly, ctrl.adminGetSettings);
router.put('/admin/settings',   auth, adminOnly, ctrl.adminUpdateSettings);
router.get('/admin/trades',     auth, adminOnly, ctrl.adminGetAllTrades);

module.exports = router;
