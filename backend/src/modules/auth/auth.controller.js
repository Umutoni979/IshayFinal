const asyncHandler = require('../../utils/asyncHandler');
const { success, error } = require('../../utils/apiResponse');
const authService = require('./auth.service');

const getRegistrationStatus = asyncHandler(async (_req, res) => {
  const enabled = await authService.getRegistrationStatus();
  return success(res, { enabled });
});

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return success(res, { userId: user.id }, 'Account created! Check your email for a verification code.', 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const loginInfo = {
    ip:        req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
    userAgent: req.headers['user-agent'] || '',
  };

  try {
    const { user, accessToken, refreshToken } = await authService.login(email, password, loginInfo);

    req.session.userId = user.id;
    req.session.role   = user.role;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   30 * 24 * 60 * 60 * 1000,
    });

    return success(res, { user, accessToken }, 'Login successful');

  } catch (err) {
    // Must change password → code sent to email → tell frontend to redirect to verify
    if (err.code === 'MUST_CHANGE_PASSWORD') {
      return res.status(403).json({
        success: false,
        code:    'MUST_CHANGE_PASSWORD',
        message: err.message,
        userId:  err.userId,
      });
    }
    throw err;
  }
});

// Verify the 6-digit code sent to email after first login
const verifyCode = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  await authService.verifyCode(userId, code);
  return success(res, { userId }, 'Code verified. Please set your new password.');
});

// Set own password — called after code is verified
const setOwnPassword = asyncHandler(async (req, res) => {
  const { userId, password } = req.body;
  const loginInfo = {
    ip:        req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
    userAgent: req.headers['user-agent'] || '',
  };
  const { user, accessToken, refreshToken } = await authService.setOwnPassword(userId, password, loginInfo);

  req.session.userId = user.id;
  req.session.role   = user.role;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   30 * 24 * 60 * 60 * 1000,
  });

  return success(res, { user, accessToken }, 'Password set successfully. Welcome!');
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return error(res, 'Refresh token required', 401);
  const tokens = await authService.refreshTokens(token);

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   30 * 24 * 60 * 60 * 1000,
  });

  return success(res, { accessToken: tokens.accessToken }, 'Token refreshed');
});

const logout = asyncHandler(async (req, res) => {
  if (req.user) await authService.logout(req.user.id, req.sid);
  req.session.destroy();
  res.clearCookie('refreshToken');
  return success(res, null, 'Logged out successfully');
});

const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getSessions(req.user.id);
  const currentSid = req.sid;
  return success(res, { sessions: sessions.map(s => ({
    id:         s.id,
    ip_address: s.ip_address,
    user_agent: s.user_agent,
    created_at: s.created_at,
    is_current: s.id === currentSid,
  }))});
});

const deleteSession = asyncHandler(async (req, res) => {
  await authService.deleteSession(req.user.id, req.params.id);
  return success(res, null, 'Session revoked');
});

const getMe = asyncHandler(async (req, res) => {
  return success(res, { user: req.user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const userId = await authService.forgotPassword(req.body.email);
  return success(res, userId ? { userId } : null, 'If that email exists, a reset code has been sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  return success(res, null, 'Password reset successfully');
});

module.exports = { getRegistrationStatus, register, login, verifyCode, setOwnPassword, refreshToken, logout, getMe, forgotPassword, resetPassword, getSessions, deleteSession };
