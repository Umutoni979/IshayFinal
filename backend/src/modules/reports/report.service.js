const { Attendance, User, Rehearsal, Role, Production } = require('../../models');
const { Op } = require('sequelize');

const getAttendanceReport = async (filters = {}) => {
  const where = {};
  if (filters.production_id) {
    const rehearsals = await Rehearsal.findAll({ where: { production_id: filters.production_id }, attributes: ['id'] });
    where.rehearsal_id = rehearsals.map((r) => r.id);
  }
  if (filters.start_date && filters.end_date) {
    const rehearsals = await Rehearsal.findAll({
      where: { date: { [Op.between]: [filters.start_date, filters.end_date] } },
      attributes: ['id'],
    });
    where.rehearsal_id = rehearsals.map((r) => r.id);
  }

  const records = await Attendance.findAll({
    where,
    include: [
      { model: User, as: 'member', attributes: ['id', 'name', 'role'] },
      { model: Rehearsal, attributes: ['id', 'title', 'date'] },
    ],
  });

  const summary = {};
  records.forEach((r) => {
    const key = r.member_id;
    if (!summary[key]) summary[key] = { member: r.member, total: 0, present: 0, absent: 0, late: 0, excused: 0 };
    summary[key][r.status]++;
    summary[key].total++;
  });

  return Object.values(summary).map((s) => ({
    ...s,
    attendance_rate: s.total ? ((s.present + s.late) / s.total * 100).toFixed(1) + '%' : '0%',
  }));
};

const getProductionReport = async (productionId) => {
  const production = await Production.findByPk(productionId, {
    include: [{ model: Role }, { model: Rehearsal }],
  });
  if (!production) throw { statusCode: 404, message: 'Production not found' };

  const rolesAssigned = production.Roles.filter((r) => r.status !== 'open').length;
  const rolesApproved = production.Roles.filter((r) => r.status === 'approved').length;

  return {
    production,
    total_roles:      production.Roles.length,
    roles_assigned:   rolesAssigned,
    roles_approved:   rolesApproved,
    total_rehearsals: production.Rehearsals.length,
  };
};

const getMemberPerformance = async (memberId) => {
  const user = await User.findByPk(memberId);
  if (!user) throw { statusCode: 404, message: 'Member not found' };

  const attendance = await Attendance.findAll({ where: { member_id: memberId } });
  const roles = await Role.findAll({
    where: { assigned_to_id: memberId },
    include: [{ model: Production, attributes: ['id', 'title'] }],
  });

  const stats = { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
  attendance.forEach((a) => { stats[a.status]++; stats.total++; });

  return {
    member: user,
    attendance_stats: {
      ...stats,
      rate: stats.total ? ((stats.present + stats.late) / stats.total * 100).toFixed(1) + '%' : '0%',
    },
    roles_assigned: roles,
  };
};

module.exports = { getAttendanceReport, getProductionReport, getMemberPerformance };
