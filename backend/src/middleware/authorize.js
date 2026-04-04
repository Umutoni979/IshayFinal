const { error } = require('../utils/apiResponse');
const { PERMISSIONS } = require('../config/roles');

// authorize('director', 'coordinator') — check by role name
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return error(res, 'Authentication required', 401);
  if (!allowedRoles.includes(req.user.role)) {
    return error(res, 'You do not have permission to perform this action', 403);
  }
  next();
};

// can('roles:approve') — check PERMISSIONS map + user's custom_permissions
const can = (action) => (req, res, next) => {
  if (!req.user) return error(res, 'Authentication required', 401);

  const roleAllowed   = (PERMISSIONS[action] || []).includes(req.user.role);
  const customAllowed = (req.user.custom_permissions || []).includes(action);

  if (!roleAllowed && !customAllowed) {
    return error(res, 'You do not have permission to perform this action', 403);
  }
  next();
};

module.exports = { authorize, can };
