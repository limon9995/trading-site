const express = require('express');
const agentAuth = require('../middleware/agentAuth');
const requirePermission = require('../middleware/requirePermission');
const {
  getUsers,
  reviewKyc,
  setTradeMode,
  modifyBalance,
  banUser,
  getDepositRequests,
  approveDepositRequest,
  rejectDepositRequest,
  getWithdrawRequests,
  approveWithdrawRequest,
  rejectWithdrawRequest,
} = require('../controllers/agentController');

const router = express.Router();

// All agent routes require agent or admin role
router.use(agentAuth);

// Users
router.get('/users', requirePermission('view_users'), getUsers);

// KYC
router.patch('/users/:id/kyc', requirePermission('kyc_approve'), reviewKyc);

// Trade mode
router.patch('/users/:id/trademode', requirePermission('force_trade'), setTradeMode);

// Balance edit
router.patch('/users/:id/balance', requirePermission('manage_balance'), modifyBalance);

// Ban / Unban user
router.patch('/users/:id/ban', requirePermission('ban_user'), banUser);

// Deposits
router.get('/deposit-requests', requirePermission('manage_deposits'), getDepositRequests);
router.patch('/deposit-requests/:id/approve', requirePermission('manage_deposits'), approveDepositRequest);
router.patch('/deposit-requests/:id/reject', requirePermission('manage_deposits'), rejectDepositRequest);

// Withdrawals
router.get('/withdraw-requests', requirePermission('manage_withdrawals'), getWithdrawRequests);
router.patch('/withdraw-requests/:id/approve', requirePermission('manage_withdrawals'), approveWithdrawRequest);
router.patch('/withdraw-requests/:id/reject', requirePermission('manage_withdrawals'), rejectWithdrawRequest);

module.exports = router;
