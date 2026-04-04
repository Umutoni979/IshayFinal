const { verifyAccessToken } = require('../utils/generateToken');
const { User } = require('../models');
const { error } = require('../utils/apiResponse');

// Supports both JWT (Authorization header) and session-based auth
const auth = async (req, res, next) => {
  try {
    // 1. Check session first
    if (req.session && req.session.userId) {
      const user = await User.findByPk(req.session.userId);
      if (user && user.is_active) {
        req.user = user;
        return next();
      }
    }

    // 2. Fall back to JWT bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return error(res, 'User not found or inactive', 401);
    }
    req.user = user;
    req.sid  = decoded.sid || null; // session ID from JWT
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

module.exports = auth;
