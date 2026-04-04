const { Attendance, Rehearsal, User, SystemSetting } = require('../../models');

const getByRehearsal = async (rehearsalId) => {
  return Attendance.findAll({
    where: { rehearsal_id: rehearsalId },
    include: [{ model: User, as: 'member', attributes: ['id', 'name', 'email', 'role'] }],
  });
};

const getByMember = async (memberId) => {
  return Attendance.findAll({
    where: { member_id: memberId },
    include: [{ model: Rehearsal, attributes: ['id', 'title', 'date', 'start_time'] }],
    order: [['created_at', 'DESC']],
  });
};

const mark = async (data, markedById) => {
  const { rehearsal_id, member_id, status, check_in_time, notes, excuse_reason } = data;
  const [record, created] = await Attendance.findOrCreate({
    where: { rehearsal_id, member_id },
    defaults: { status, check_in_time, notes, excuse_reason, marked_by_id: markedById },
  });
  if (!created) {
    await record.update({ status, check_in_time, notes, excuse_reason, marked_by_id: markedById });
  }
  return record;
};

const update = async (id, data) => {
  const record = await Attendance.findByPk(id);
  if (!record) throw { statusCode: 404, message: 'Attendance record not found' };
  await record.update(data);
  return record;
};

const getSummaryByProduction = async (productionId) => {
  const rehearsals = await Rehearsal.findAll({ where: { production_id: productionId } });
  const rehearsalIds = rehearsals.map((r) => r.id);
  const records = await Attendance.findAll({ where: { rehearsal_id: rehearsalIds } });

  const byMember = {};
  records.forEach((r) => {
    if (!byMember[r.member_id]) byMember[r.member_id] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    byMember[r.member_id][r.status]++;
    byMember[r.member_id].total++;
  });
  return byMember;
};

// ─── Self check-in ────────────────────────────────────────────
// Any member can call this IF the admin has enabled allow_self_checkin
const selfCheckin = async (rehearsalId, userId, status = 'present') => {
  // 1. Check the system setting
  const setting = await SystemSetting.findOne({ where: { key: 'allow_self_checkin' } });
  if (!setting || setting.value !== 'true') {
    throw { statusCode: 403, message: 'Self check-in is not enabled by the administrator' };
  }

  // 2. Verify the rehearsal exists
  const rehearsal = await Rehearsal.findByPk(rehearsalId);
  if (!rehearsal) throw { statusCode: 404, message: 'Rehearsal not found' };

  // 3. Check window (minutes after rehearsal start) if set
  const windowSetting = await SystemSetting.findOne({ where: { key: 'self_checkin_cutoff' } });
  const windowMinutes = windowSetting ? parseInt(windowSetting.value) : 0;
  if (windowMinutes > 0 && rehearsal.start_time) {
    const [h, m] = rehearsal.start_time.split(':').map(Number);
    const startMins = h * 60 + m;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins > startMins + windowMinutes) {
      const closeH = Math.floor((startMins + windowMinutes) / 60) % 24;
      const closeM = (startMins + windowMinutes) % 60;
      const closeStr = `${String(closeH).padStart(2, '0')}:${String(closeM).padStart(2, '0')}`;
      throw { statusCode: 403, message: `Check-in closed at ${closeStr}` };
    }
  }

  // 4. Only allow present or late — coordinators handle absent/excused
  if (!['present', 'late'].includes(status)) {
    throw { statusCode: 400, message: 'You can only check in as present or late' };
  }

  // 4. Upsert the attendance record
  const [record] = await Attendance.findOrCreate({
    where: { rehearsal_id: rehearsalId, member_id: userId },
    defaults: { status, check_in_time: new Date().toTimeString().slice(0, 8), marked_by_id: userId },
  });
  if (record.status !== status) {
    await record.update({ status, check_in_time: new Date().toTimeString().slice(0, 8) });
  }
  return record;
};

module.exports = { getByRehearsal, getByMember, mark, update, getSummaryByProduction, selfCheckin };
