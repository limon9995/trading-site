const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// GET /api/settings/support — public: get telegram + email for support page
router.get('/support', async (req, res) => {
  try {
    const settings = await SiteSettings.find({ key: { $in: ['telegram_link', 'support_email', 'telegram_username'] } });
    const result = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// GET /api/settings/all — admin: get all settings
router.get('/all', adminAuth, async (req, res) => {
  try {
    const settings = await SiteSettings.find().sort({ key: 1 });
    const result = {};
    for (const s of settings) result[s.key] = s.value;
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

// PUT /api/settings — admin: upsert a setting key/value
router.put('/', adminAuth, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key is required.' });
    await SiteSettings.findOneAndUpdate({ key }, { value: value || '' }, { upsert: true, new: true });
    res.json({ message: 'Setting saved.' });
  } catch {
    res.status(500).json({ error: 'Failed to save setting.' });
  }
});

module.exports = router;
