const auth = require('./auth');

// Admin middleware: first run auth, then check role
const adminAuth = async (req, res, next) => {
  await auth(req, res, async () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admin only.' });
    }
  });
};

module.exports = adminAuth;
