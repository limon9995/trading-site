const express = require('express');
const { body } = require('express-validator');
const { register, sendRegisterOtp, login, getMe, changePassword, updateProfile, submitKyc, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/send-register-otp', authLimiter, sendRegisterOtp);
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);
router.put('/profile', auth, updateProfile);
router.post('/kyc/submit', auth, submitKyc);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
