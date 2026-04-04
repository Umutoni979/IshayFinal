const { User, SystemSetting } = require('../../models');
const { sendEmail } = require('../../utils/emailService');

const getAllUsers = async () => User.findAll({ order: [['created_at', 'DESC']] });

// Admin creates user with email + temp password they choose
const createUser = async (data) => {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw { statusCode: 409, message: 'Email already registered' };

  const user = await User.create({
    name:                 data.name,
    email:                data.email,
    password:             data.temp_password,
    role:                 data.role || 'actor',
    member_type:          data.member_type || null,
    phone:                data.phone || null,
    custom_permissions:   data.custom_permissions || [],
    is_verified:          false,
    must_change_password: true,
  });

  // Send credentials to user's email automatically
  await sendEmail({
    to: user.email,
    subject: 'Welcome to ISHYA Culture Troup — Your Account Credentials',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#3730a3;margin-bottom:4px">Welcome, ${user.name}!</h2>
        <p style="color:#6b7280;margin-top:0">Your account has been created on <strong>ISHYA Culture Troup</strong> management system.</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
          <p style="margin:0 0 10px 0;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Your Login Credentials</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;width:140px">Email</td>
              <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:700">${user.email}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px">Temporary Password</td>
              <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:700;font-family:monospace;letter-spacing:2px">${data.temp_password}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px">Role</td>
              <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:700;text-transform:capitalize">${user.role}</td>
            </tr>
          </table>
        </div>

        <p style="color:#374151;font-size:14px">
          <strong>Next steps:</strong><br/>
          1. Go to the login page and sign in with the credentials above.<br/>
          2. A verification code will be sent to this email — enter it to proceed.<br/>
          3. Set your own permanent password.
        </p>

        <p style="color:#9ca3af;font-size:12px;margin-top:20px;border-top:1px solid #e5e7eb;padding-top:12px">
          Please keep your credentials safe. Do not share your password with anyone.<br/>
          If you did not expect this email, please ignore it.
        </p>
      </div>
    `,
  });

  return user;
};

const setUserStatus = async (id, is_active) => {
  const user = await User.findByPk(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  await user.update({ is_active });
  return user;
};

const changeUserRole = async (id, role) => {
  const user = await User.findByPk(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  await user.update({ role });
  return user;
};

const updateUserPermissions = async (id, custom_permissions) => {
  const user = await User.findByPk(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  await user.update({ custom_permissions });
  return user;
};

const updateUser = async (id, data, requesterId) => {
  if (id === requesterId) throw { statusCode: 400, message: 'You cannot edit your own account here' };
  const user = await User.findByPk(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  const allowed = { name: data.name, phone: data.phone, member_type: data.member_type };
  await user.update(allowed);
  return user;
};

const deleteUser = async (id, requesterId) => {
  if (id === requesterId) throw { statusCode: 400, message: 'You cannot delete your own account' };
  const user = await User.findByPk(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  await user.destroy();
};

const toggleRegistration = async (enable) => {
  await SystemSetting.upsert({ key: 'allow_registration', value: String(enable) });
  return enable;
};

const toggleSelfCheckin = async (enable) => {
  await SystemSetting.upsert({ key: 'allow_self_checkin', value: String(enable) });
  return enable;
};

const getSelfCheckinStatus = async () => {
  const [enabledSetting, cutoffSetting] = await Promise.all([
    SystemSetting.findOne({ where: { key: 'allow_self_checkin' } }),
    SystemSetting.findOne({ where: { key: 'self_checkin_cutoff' } }),
  ]);
  const windowMinutes = cutoffSetting?.value ? parseInt(cutoffSetting.value) : 0;
  return {
    enabled:       enabledSetting ? enabledSetting.value === 'true' : false,
    windowMinutes: isNaN(windowMinutes) ? 0 : windowMinutes,
  };
};

const setSelfCheckinCutoff = async (cutoff) => {
  await SystemSetting.upsert({ key: 'self_checkin_cutoff', value: cutoff || '' });
  return cutoff;
};

module.exports = { getAllUsers, createUser, setUserStatus, changeUserRole, updateUserPermissions, toggleRegistration, toggleSelfCheckin, getSelfCheckinStatus, setSelfCheckinCutoff, updateUser, deleteUser };
