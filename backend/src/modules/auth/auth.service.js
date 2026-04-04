const crypto = require('crypto');
const { User, UserSession, SystemSetting } = require('../../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/generateToken');
const { sendEmail } = require('../../utils/emailService');

// Returns true if registration is open
const getRegistrationStatus = async () => {
  const directorCount = await User.count({ where: { role: 'director' } });
  if (directorCount === 0) return true; // first-run: auto-enable
  const setting = await SystemSetting.findOne({ where: { key: 'allow_registration' } });
  return setting?.value === 'true';
};

const register = async (data) => {
  const open = await getRegistrationStatus();
  if (!open) throw { statusCode: 403, message: 'Registration is currently disabled.' };

  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw { statusCode: 409, message: 'Email already in use' };

  // Sign-up always creates a director (admin) account
  const code    = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  const user = await User.create({
    name:                 data.name,
    email:                data.email,
    password:             data.password,
    role:                 'director',
    must_change_password: false,
    is_verified:          false,
    verification_code:    code,
    verification_expires: expires,
  });

  // Lock sign-up immediately after account is created
  await SystemSetting.upsert({ key: 'allow_registration', value: 'false' });

  await sendEmail({
    to: user.email,
    subject: 'ISHYA — Verify your new admin account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#3730a3">Verify Your Account</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Enter this code to verify your new admin account:</p>
        <div style="text-align:center;margin:24px 0">
          <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#4f46e5;font-family:monospace">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px">This code expires in 15 minutes.</p>
      </div>
    `,
  });

  return user;
};

const login = async (email, password, login = {}) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !user.is_active) throw { statusCode: 401, message: 'Invalid credentials' };

  const match = await user.comparePassword(password);
  if (!match) throw { statusCode: 401, message: 'Invalid credentials' };

  // If user must change password → send verification code to their email first
  if (user.must_change_password) {
    const code    = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await user.update({ verification_code: code, verification_expires: expires });

    await sendEmail({
      to: user.email,
      subject: 'ISHYA Culture Troup — Your Verification Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#3730a3">Verify Your Identity</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You logged in successfully. Enter this code to set your new password:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#4f46e5;font-family:monospace">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:13px">This code expires in 15 minutes.</p>
        </div>
      `,
    });

    throw {
      statusCode: 403,
      code: 'MUST_CHANGE_PASSWORD',
      message: 'A verification code has been sent to your email. Please verify to set your new password.',
      userId: user.id,
    };
  }

  const session      = await UserSession.create({ user_id: user.id, ip_address: login.ip, user_agent: login.userAgent });
  const payload      = { id: user.id, role: user.role, sid: session.id };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await user.update({ refresh_token: refreshToken });

  return { user, accessToken, refreshToken };
};

// Step 1: verify the code sent after login
const verifyCode = async (userId, code) => {
  const user = await User.findByPk(userId);
  if (!user) throw { statusCode: 404, message: 'User not found' };

  if (!user.verification_code || user.verification_code !== code) {
    throw { statusCode: 400, message: 'Invalid verification code' };
  }
  if (user.verification_expires < new Date()) {
    throw { statusCode: 400, message: 'Verification code expired. Please log in again to get a new one.' };
  }

  // Clear code — user is now allowed to set password
  await user.update({ verification_code: null, verification_expires: null });
  return user;
};

// Step 2: set new password after code verified
const setOwnPassword = async (userId, newPassword, loginInfo = {}) => {
  const user = await User.findByPk(userId);
  if (!user) throw { statusCode: 404, message: 'User not found' };

  await user.update({
    password:             newPassword,
    must_change_password: false,
    is_verified:          true,
  });

  // Now issue tokens so user is logged in immediately
  const session      = await UserSession.create({ user_id: user.id, ip_address: loginInfo.ip, user_agent: loginInfo.userAgent });
  const payload      = { id: user.id, role: user.role, sid: session.id };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await user.update({ refresh_token: refreshToken });

  return { user, accessToken, refreshToken };
};

const refreshTokens = async (token) => {
  const decoded = verifyRefreshToken(token);
  const user    = await User.findByPk(decoded.id);
  if (!user || user.refresh_token !== token) throw { statusCode: 401, message: 'Invalid refresh token' };

  const payload      = { id: user.id, role: user.role };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await user.update({ refresh_token: refreshToken });
  return { accessToken, refreshToken };
};

const logout = async (userId, sessionId) => {
  await User.update({ refresh_token: null }, { where: { id: userId } });
  if (sessionId) await UserSession.destroy({ where: { id: sessionId, user_id: userId } });
};

const getSessions = async (userId) => {
  return UserSession.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: 10,
  });
};

const deleteSession = async (userId, sessionId) => {
  const deleted = await UserSession.destroy({ where: { id: sessionId, user_id: userId } });
  if (!deleted) throw { statusCode: 404, message: 'Session not found' };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return null;

  const code    = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await user.update({ verification_code: code, verification_expires: expires });

  await sendEmail({
    to: email,
    subject: 'Password Reset — ISHYA Culture Troup',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#3730a3">Reset Your Password</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Use this code to reset your password:</p>
        <div style="text-align:center;margin:24px 0">
          <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#f97316;font-family:monospace">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px">This code expires in 15 minutes. If you did not request this, ignore this email.</p>
      </div>
    `,
  });

  return user.id;
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({ where: { reset_password_token: token } });
  if (!user || user.reset_password_expires < new Date()) {
    throw { statusCode: 400, message: 'Invalid or expired reset token' };
  }
  await user.update({ password: newPassword, reset_password_token: null, reset_password_expires: null });
};

module.exports = { getRegistrationStatus, register, login, verifyCode, setOwnPassword, refreshTokens, logout, getSessions, deleteSession, forgotPassword, resetPassword };
