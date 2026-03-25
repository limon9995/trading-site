const express = require('express');
const { body } = require('express-validator');
const { getPlans, purchasePlan, getMyPlan } = require('../controllers/planController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/plans - public, returns all active plans
router.get('/', getPlans);

// GET /api/plans/my - get current user's plan (auth required)
router.get('/my', auth, getMyPlan);

// POST /api/plans/purchase - purchase a plan (auth required)
router.post('/purchase', auth, [
  body('planName').notEmpty().withMessage('Plan name is required'),
], purchasePlan);

module.exports = router;
