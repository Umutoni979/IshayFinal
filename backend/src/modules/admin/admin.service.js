const {
  User, SystemSetting, Rehearsal, Attendance,
  Role, Notification, Conflict, UserSession,
  sequelize,
} = require('../../models');
const { Op } = require('sequelize');
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

  const t = await sequelize.transaction();
  try {
    // 1. Sessions
    await UserSession.destroy({ where: { user_id: id }, transaction: t });

    // 2. Notifications (recipient or sender)
    await Notification.destroy({ where: { [Op.or]: [{ recipient_id: id }, { sender_id: id }] }, transaction: t });

    // 3. Attendance records (as member or marker)
    await Attendance.destroy({ where: { [Op.or]: [{ member_id: id }, { marked_by_id: id }] }, transaction: t });

    // 4. Roles — unassign if assigned, nullify suggested_by / approved_by references
    await Role.update({ assigned_to_id: null, status: 'open' }, { where: { assigned_to_id: id }, transaction: t });
    await Role.update({ suggested_by_id: null }, { where: { suggested_by_id: id }, transaction: t });
    await Role.update({ approved_by_id: null  }, { where: { approved_by_id:  id }, transaction: t });

    // 5. Remove from junction tables (RehearsalMember, ConflictMember, ProductionCoordinator)
    await sequelize.query('DELETE FROM rehearsal_members WHERE user_id = :id',       { replacements: { id }, transaction: t });
    await sequelize.query('DELETE FROM conflict_members WHERE user_id = :id',        { replacements: { id }, transaction: t });
    await sequelize.query('DELETE FROM production_coordinators WHERE user_id = :id', { replacements: { id }, transaction: t });

    // 6. Nullify soft refs on other records (keep the records, just remove the user link)
    await Conflict.update({ resolved_by_id: null }, { where: { resolved_by_id: id }, transaction: t });

    // 7. Finally delete the user
    await user.destroy({ transaction: t });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const toggleRegistration = async (enable) => {
  await SystemSetting.upsert({ key: 'allow_registration', value: String(enable) });
  return enable;
};

// Auto-mark absent for today's rehearsals for members who didn't check in
const autoMarkAbsent = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const todayRehearsals = await Rehearsal.findAll({ where: { date: today } });
  if (!todayRehearsals.length) return;

  const members = await User.findAll({
    where: { is_active: true, role: { [Op.in]: ['actor', 'crew', 'guest'] } },
    attributes: ['id'],
  });

  for (const rehearsal of todayRehearsals) {
    for (const member of members) {
      await Attendance.findOrCreate({
        where: { rehearsal_id: rehearsal.id, member_id: member.id },
        defaults: { status: 'absent' },
      });
      // Only set absent if no record exists — don't overwrite present/late
    }
  }
};

const toggleSelfCheckin = async (enable) => {
  if (!enable) {
    await autoMarkAbsent();
    await SystemSetting.upsert({ key: 'self_checkin_closes_at', value: '' });
  }
  await SystemSetting.upsert({ key: 'allow_self_checkin', value: String(enable) });
  return enable;
};

const getSelfCheckinStatus = async () => {
  const [enabledSetting, closesSetting] = await Promise.all([
    SystemSetting.findOne({ where: { key: 'allow_self_checkin' } }),
    SystemSetting.findOne({ where: { key: 'self_checkin_closes_at' } }),
  ]);
  const enabled  = enabledSetting ? enabledSetting.value === 'true' : false;
  const closesAt = closesSetting?.value || null;
  const isExpired = closesAt && new Date() > new Date(closesAt);

  // Auto-mark absent and clean up when window expires
  if (enabled && isExpired) {
    await autoMarkAbsent();
    await SystemSetting.upsert({ key: 'allow_self_checkin', value: 'false' });
    await SystemSetting.upsert({ key: 'self_checkin_closes_at', value: '' });
    return { enabled: false, closesAt: null };
  }

  return {
    enabled:  enabled,
    closesAt: closesAt || null,
  };
};

// Admin opens self check-in with a window in minutes (0 = no limit)
const openSelfCheckin = async (windowMinutes) => {
  const mins = parseInt(windowMinutes) || 0;
  await SystemSetting.upsert({ key: 'allow_self_checkin', value: 'true' });
  if (mins > 0) {
    const closesAt = new Date(Date.now() + mins * 60 * 1000).toISOString();
    await SystemSetting.upsert({ key: 'self_checkin_closes_at', value: closesAt });
  } else {
    await SystemSetting.upsert({ key: 'self_checkin_closes_at', value: '' });
  }
  return { enabled: true, windowMinutes: mins };
};

module.exports = { getAllUsers, createUser, setUserStatus, changeUserRole, updateUserPermissions, toggleRegistration, toggleSelfCheckin, getSelfCheckinStatus, openSelfCheckin, autoMarkAbsent, updateUser, deleteUser };
