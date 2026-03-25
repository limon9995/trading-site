const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { getDepositAddresses, submitDepositRequest, getDepositHistory } = require('../controllers/depositController');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/vouchers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config: save voucher images to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `voucher_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

// GET /api/deposit/addresses - get all active deposit addresses
router.get('/addresses', auth, getDepositAddresses);

// POST /api/deposit/submit - submit deposit request with voucher
router.post('/submit', auth, upload.single('voucher'), submitDepositRequest);

// GET /api/deposit/history - user's deposit history
router.get('/history', auth, getDepositHistory);

module.exports = router;
