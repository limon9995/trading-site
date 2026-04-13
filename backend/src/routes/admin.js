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
  setBalanceMode,
  getWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
} = require('../controllers/adminController');
const {
  listAgents,
  createAgent,
  updateAgentPermissions,
  banAgent,
} = require('../controllers/agentController');
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
router.patch('/users/:id/ban',          banUser);
router.patch('/users/:id/trademode',    setTradeMode);
router.patch('/users/:id/balancemode',  setBalanceMode);

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

// Agent management (admin only)
router.get('/agents', listAgents);
router.post('/agents', createAgent);
router.patch('/agents/:id/permissions', updateAgentPermissions);
router.patch('/agents/:id/ban', banAgent);

module.exports = router;
