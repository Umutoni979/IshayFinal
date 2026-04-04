const { User, Attendance, Role, Rehearsal } = require('../../models');
const { Op } = require('sequelize');

const getAllUsers = async (filters = {}) => {
  const where = {};
  if (filters.role)      where.role      = filters.role;
  if (filters.is_active !== undefined) where.is_active = filters.is_active;
  if (filters.search) {
    where[Op.or] = [
      { name:  { [Op.iLike]: `%${filters.search}%` } },
      { email: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const page  = Math.max(1, parseInt(filters.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where,
    order:  [['name', 'ASC']],
    limit,
    offset,
  });

  return {
    users:      rows,
    total:      count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  return user;
};

const updateUser = async (id, data, requesterId, requesterRole) => {
  const user = await getUserById(id);
  // Members can only update themselves
  if (requesterRole !== 'director' && requesterRole !== 'coordinator' && id !== requesterId) {
    throw { statusCode: 403, message: 'You can only update your own profile' };
  }
  // Only director can change roles
  if (data.role && requesterRole !== 'director') {
    delete data.role;
  }
  await user.update(data);
  return user;
};

const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.destroy();
};

const deactivateUser = async (id) => {
  const user = await getUserById(id);
  await user.update({ is_active: false });
  return user;
};

const getUserAttendanceSummary = async (userId) => {
  const records = await Attendance.findAll({ where: { member_id: userId } });
  const summary = { total: records.length, present: 0, absent: 0, late: 0, excused: 0 };
  records.forEach((r) => { summary[r.status] = (summary[r.status] || 0) + 1; });
  summary.attendance_rate = summary.total ? ((summary.present + summary.late) / summary.total * 100).toFixed(1) : 0;
  return summary;
};

const getUserAssignedRoles = async (userId) => {
  return Role.findAll({
    where: { assigned_to_id: userId },
    include: ['Production'],
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  deactivateUser,
  getUserAttendanceSummary,
  getUserAssignedRoles,
};
