const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendPasswordResetOTP, sendRegisterOTP } = require('../utils/mailer');

// In-memory OTP store for password reset
const resetOtpStore = new Map(); // email -> { otp, expiresAt, userId }
const RESET_OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes

// In-memory OTP store for registration
const registerOtpStore = new Map(); // email -> { otp, expiresAt, pendingData }
const REGISTER_OTP_EXPIRY = 10 * 60 * 1000;

const normalizeEmail = (email = '') => email.toLowerCase().trim();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/send-register-otp — validate form data, send OTP
const sendRegisterOtp = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required.' });
    if (username.length < 3 || username.length > 20) return res.status(400).json({ error: 'Username must be 3-20 characters.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} already in use.` });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    registerOtpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + REGISTER_OTP_EXPIRY,
      pendingData: { ...req.body, email: normalizedEmail },
    });

    await sendRegisterOTP(normalizedEmail, otp, username);
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Send register OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// POST /api/auth/register — verify OTP then create account
const register = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // OTP verification
    if (!otp) return res.status(400).json({ error: 'OTP is required.' });
    const record = registerOtpStore.get(normalizedEmail);
    if (!record) return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    if (Date.now() > record.expiresAt) {
      registerOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'OTP expired. Please try again.' });
    }
    if (record.otp !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP.' });

    const { username, password, referralCode } = record.pendingData;

    // Double-check uniqueness
    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
      return res.status(409).json({ error: `${field} already in use.` });
    }

    const newUser = new User({ username, email: normalizedEmail, password });

    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        newUser.referredBy = referrer._id;
        referrer.referralCount += 1;
        await referrer.save();
      }
    }

    await newUser.save();
    registerOtpStore.delete(normalizedEmail);

    const token = generateToken(newUser._id);
    res.status(201).json({ message: 'Account created successfully!', token, user: newUser.toSafeObject() });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({ error: `Your account has been suspended. Reason: ${user.banReason || 'Policy violation'}` });
    }

    // Update last login (no pre-save hook)
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
};

// PUT /api/auth/profile — update KYC/profile info
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, mobile, address, city, zipCode, state, country } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName  !== undefined) user.lastName  = lastName.trim();
    if (mobile    !== undefined) user.mobile     = mobile.trim();
    if (address   !== undefined) user.address    = address.trim();
    if (city      !== undefined) user.city       = city.trim();
    if (zipCode   !== undefined) user.zipCode    = zipCode.trim();
    if (state     !== undefined) user.state      = state.trim();
    if (country   !== undefined) user.country    = country.trim();

    // Mark KYC as pending when profile is submitted with real name
    if (firstName && lastName && user.kycStatus === 'unverified') {
      user.kycStatus = 'pending';
      user.kycSubmittedAt = new Date();
    }

    await user.save();
    res.json({ message: 'Profile updated successfully.', user: user.toSafeObject() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// POST /api/auth/forgot-password — send OTP to email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    resetOtpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + RESET_OTP_EXPIRY, userId: user._id });

    await sendPasswordResetOTP(normalizedEmail, otp, user.username);
    res.json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// POST /api/auth/verify-reset-otp — verify OTP
const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });
    const normalizedEmail = normalizeEmail(email);

    const record = resetOtpStore.get(normalizedEmail);
    if (!record) return res.status(400).json({ error: 'No OTP request found. Please try again.' });
    if (Date.now() > record.expiresAt) {
      resetOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP.' });

    // Mark as verified (keep in store for reset step)
    resetOtpStore.set(normalizedEmail, { ...record, verified: true });
    res.json({ message: 'OTP verified.' });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    res.status(500).json({ error: 'Verification failed.' });
  }
};

// POST /api/auth/reset-password — set new password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields are required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const normalizedEmail = normalizeEmail(email);

    const record = resetOtpStore.get(normalizedEmail);
    if (!record || !record.verified || record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid or expired session. Please start over.' });
    }
    if (Date.now() > record.expiresAt) {
      resetOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Session expired. Please start over.' });
    }

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();
    resetOtpStore.delete(normalizedEmail);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

module.exports = { register, sendRegisterOtp, login, getMe, changePassword, updateProfile, forgotPassword, verifyResetOtp, resetPassword };
