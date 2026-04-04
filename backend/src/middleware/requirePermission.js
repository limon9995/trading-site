// Higher-order middleware factory for agent permission checks.
// Admins bypass all permission checks. Agents must have the specific permission.
const requirePermission = (permission) => (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (req.user.agentPermissions && req.user.agentPermissions.includes(permission)) {
    return next();
  }
  return res.status(403).json({ error: `Permission denied. Requires: ${permission}` });
};

module.exports = requirePermission;
