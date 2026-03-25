const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getAllTrades,
  modifyBalance,
  getStats,
  setUserRole,
  getAnalytics,
  adjustPlan,
  reviewKyc,
  getAdminDepositAddresses,
  addDepositAddress,
  updateDepositAddress,
  deleteDepositAddress,
  getDepositRequests,
  approveDepositRequest,
  rejectDepositRequest,
  getPlanPurchases,
  banUser,
  setTradeMode,
  getWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All admin routes require admin role
router.use(adminAuth);

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.get('/trades', getAllTrades);

router.patch('/users/:id/balance', [
  body('amount').isFloat().withMessage('Amount must be a number'),
], modifyBalance);

router.patch('/users/:id/role', setUserRole);
router.patch('/users/:id/plan', adjustPlan);
router.patch('/users/:id/kyc', reviewKyc);
router.patch('/users/:id/ban',       banUser);
router.patch('/users/:id/trademode', setTradeMode);

// Deposit Address management
router.get('/deposit-addresses', getAdminDepositAddresses);
router.post('/deposit-addresses', addDepositAddress);
router.put('/deposit-addresses/:id', updateDepositAddress);
router.delete('/deposit-addresses/:id', deleteDepositAddress);

// Deposit Request management
router.get('/deposit-requests', getDepositRequests);
router.patch('/deposit-requests/:id/approve', approveDepositRequest);
router.patch('/deposit-requests/:id/reject', rejectDepositRequest);

// Withdraw Request management
router.get('/withdraw-requests', getWithdrawRequests);
router.patch('/withdraw-requests/:id/approve', approveWithdrawRequest);
router.patch('/withdraw-requests/:id/reject', rejectWithdrawRequest);

// Plan purchases
router.get('/plan-purchases', getPlanPurchases);

module.exports = router;
