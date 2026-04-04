const auth = require('./auth');

// Agent middleware: first run auth, then check role is admin or agent
const agentAuth = async (req, res, next) => {
  await auth(req, res, async () => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'agent')) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Agent or Admin only.' });
    }
  });
};

module.exports = agentAuth;
